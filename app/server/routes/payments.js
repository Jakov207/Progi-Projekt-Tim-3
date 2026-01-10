const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { verifyToken, isStudent } = require('../middleware/auth');

// Initialize Stripe (only if API key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * @swagger
 * /api/payments/intent:
 *   post:
 *     summary: Create a payment intent for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment intent created
 */
router.post('/intent', verifyToken, isStudent, async (req, res) => {
    const client = await pool.connect();
    
    try {
        if (!stripe) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is not configured'
            });
        }

        await client.query('BEGIN');

        const studentId = req.user.id;
        const { bookingId } = req.body;

        // Get booking details
        const bookingResult = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND student_id = $2',
            [bookingId, studentId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult.rows[0];

        // Check if payment already exists
        const existingPayment = await client.query(
            'SELECT * FROM payments WHERE booking_id = $1 AND status IN ($2, $3)',
            [bookingId, 'completed', 'processing']
        );

        if (existingPayment.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Payment already exists for this booking'
            });
        }

        // Create Stripe payment intent
        const amount = Math.round(booking.price * 100); // Convert to cents
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            metadata: {
                bookingId: booking.id,
                studentId: studentId,
                tutorId: booking.tutor_id
            },
            description: `Booking payment for ${booking.booking_date}`
        });

        // Create payment record
        const paymentResult = await client.query(`
            INSERT INTO payments (
                booking_id, student_id, tutor_id, amount, 
                currency, status, payment_method, stripe_payment_intent_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            bookingId, studentId, booking.tutor_id, booking.price,
            'EUR', 'pending', 'stripe_card', paymentIntent.id
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                payment: paymentResult.rows[0]
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent'
        });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ success: false, message: 'Payment service not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                
                // Update payment status
                const paymentResult = await client.query(`
                    UPDATE payments 
                    SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_payment_intent_id = $1
                    RETURNING *
                `, [paymentIntent.id]);

                if (paymentResult.rows.length > 0) {
                    const payment = paymentResult.rows[0];

                    // Update booking status to confirmed
                    await client.query(`
                        UPDATE bookings 
                        SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [payment.booking_id]);

                    // Create notifications
                    await client.query(`
                        INSERT INTO notifications (user_id, type, title, message, data)
                        VALUES 
                            ($1, 'payment_received', 'Payment Received', 'Your payment was successful', $3),
                            ($2, 'payment_received', 'Payment Received', 'You have received a payment', $3)
                    `, [
                        payment.student_id,
                        payment.tutor_id,
                        JSON.stringify({ paymentId: payment.id, bookingId: payment.booking_id })
                    ]);

                    logger.info(`Payment completed: ${payment.id}`);
                }
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                
                await client.query(`
                    UPDATE payments 
                    SET status = 'failed', updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_payment_intent_id = $1
                `, [failedIntent.id]);

                logger.warn(`Payment failed: ${failedIntent.id}`);
                break;

            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }

        await client.query('COMMIT');
        res.json({ received: true });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error processing webhook:', error);
        res.status(500).json({ success: false, message: 'Webhook processing failed' });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT p.* FROM payments p
            WHERE p.id = $1 AND (p.student_id = $2 OR p.tutor_id = $2)
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
});

/**
 * @swagger
 * /api/payments/booking/{bookingId}:
 *   get:
 *     summary: Get payment for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/booking/:bookingId', verifyToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT p.* FROM payments p
            WHERE p.booking_id = $1 AND (p.student_id = $2 OR p.tutor_id = $2)
        `, [bookingId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { verifyToken, isStudent, isTutor } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT 
                b.*,
                s.name as subject_name,
                CASE 
                    WHEN b.student_id = $1 THEN 
                        jsonb_build_object(
                            'id', tu.id,
                            'name', tu.name,
                            'surname', tu.surname,
                            'profilePicture', tu.profile_picture
                        )
                    ELSE 
                        jsonb_build_object(
                            'id', su.id,
                            'name', su.name,
                            'surname', su.surname,
                            'profilePicture', su.profile_picture
                        )
                END as other_party
            FROM bookings b
            LEFT JOIN subjects s ON b.subject_id = s.id
            LEFT JOIN users tu ON b.tutor_id = tu.id
            LEFT JOIN users su ON b.student_id = su.id
            WHERE (b.student_id = $1 OR b.tutor_id = $1)
        `;

        const params = [userId];
        let paramIndex = 2;

        if (status) {
            query += ` AND b.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY b.booking_date DESC, b.start_time DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings'
        });
    }
});

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tutorId
 *               - subjectId
 *               - bookingDate
 *               - startTime
 *               - endTime
 *               - format
 *             properties:
 *               tutorId:
 *                 type: integer
 *               subjectId:
 *                 type: integer
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [online, in_person]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', verifyToken, isStudent, validate(schemas.createBooking), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const studentId = req.user.id;
        const {
            tutorId,
            subjectId,
            bookingDate,
            startTime,
            endTime,
            format,
            notes,
            location
        } = req.body;

        // Calculate duration
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        const durationMinutes = (end - start) / 60000;

        // Get tutor's rate based on duration
        const tutorResult = await client.query(
            'SELECT hourly_rate_30min, hourly_rate_45min, hourly_rate_60min, hourly_rate_90min FROM tutor_profiles WHERE user_id = $1',
            [tutorId]
        );

        if (tutorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Tutor not found'
            });
        }

        // Determine rate based on duration
        let rate;
        if (durationMinutes <= 30) rate = tutorResult.rows[0].hourly_rate_30min;
        else if (durationMinutes <= 45) rate = tutorResult.rows[0].hourly_rate_45min;
        else if (durationMinutes <= 60) rate = tutorResult.rows[0].hourly_rate_60min;
        else rate = tutorResult.rows[0].hourly_rate_90min;

        const price = rate || 0;

        // Check for conflicts
        const conflictResult = await client.query(`
            SELECT id FROM bookings 
            WHERE tutor_id = $1 
            AND booking_date = $2 
            AND status NOT IN ('cancelled', 'completed')
            AND (
                (start_time <= $3 AND end_time > $3) OR
                (start_time < $4 AND end_time >= $4) OR
                (start_time >= $3 AND end_time <= $4)
            )
        `, [tutorId, bookingDate, startTime, endTime]);

        if (conflictResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Time slot is not available'
            });
        }

        // Create booking
        const bookingResult = await client.query(`
            INSERT INTO bookings (
                student_id, tutor_id, subject_id, booking_date, 
                start_time, end_time, duration_minutes, format, 
                price, notes, location, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
            RETURNING *
        `, [studentId, tutorId, subjectId, bookingDate, startTime, endTime, durationMinutes, format, price, notes, location]);

        const booking = bookingResult.rows[0];

        // Create notification for tutor
        await client.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'booking_request', 'New Booking Request', $2, $3)
        `, [
            tutorId,
            `You have a new booking request for ${bookingDate}`,
            JSON.stringify({ bookingId: booking.id })
        ]);

        await client.query('COMMIT');

        logger.info(`Booking created: ${booking.id} by student ${studentId}`);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking'
        });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     tags: [Bookings]
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
 *         description: Booking details
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                b.*,
                s.name as subject_name,
                tu.name as tutor_name,
                tu.surname as tutor_surname,
                tu.profile_picture as tutor_picture,
                su.name as student_name,
                su.surname as student_surname,
                su.profile_picture as student_picture
            FROM bookings b
            LEFT JOIN subjects s ON b.subject_id = s.id
            LEFT JOIN users tu ON b.tutor_id = tu.id
            LEFT JOIN users su ON b.student_id = su.id
            WHERE b.id = $1 AND (b.student_id = $2 OR b.tutor_id = $2)
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking'
        });
    }
});

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a booking (tutor only)
 *     tags: [Bookings]
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
 *         description: Booking confirmed
 */
router.patch('/:id/confirm', verifyToken, isTutor, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const tutorId = req.user.id;

        // Update booking status
        const result = await client.query(`
            UPDATE bookings 
            SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND tutor_id = $2 AND status = 'pending'
            RETURNING *
        `, [id, tutorId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already processed'
            });
        }

        const booking = result.rows[0];

        // Create notification for student
        await client.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'booking_confirmed', 'Booking Confirmed', $2, $3)
        `, [
            booking.student_id,
            `Your booking for ${booking.booking_date} has been confirmed`,
            JSON.stringify({ bookingId: booking.id })
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Booking confirmed successfully',
            data: booking
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming booking'
        });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.patch('/:id/cancel', verifyToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const result = await client.query(`
            UPDATE bookings 
            SET 
                status = 'cancelled',
                cancellation_reason = $1,
                cancelled_by = $2,
                cancelled_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 
            AND (student_id = $2 OR tutor_id = $2)
            AND status IN ('pending', 'confirmed')
            RETURNING *
        `, [reason, userId, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Booking not found or cannot be cancelled'
            });
        }

        const booking = result.rows[0];

        // Notify the other party
        const notifyUserId = booking.student_id === userId ? booking.tutor_id : booking.student_id;
        
        await client.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'booking_cancelled', 'Booking Cancelled', $2, $3)
        `, [
            notifyUserId,
            `A booking for ${booking.booking_date} has been cancelled`,
            JSON.stringify({ bookingId: booking.id, reason })
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking'
        });
    } finally {
        client.release();
    }
});

module.exports = router;

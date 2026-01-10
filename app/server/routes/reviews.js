const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { verifyToken, isStudent } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a booking
 *     tags: [Reviews]
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
 *               - overallRating
 *             properties:
 *               bookingId:
 *                 type: integer
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               communicationRating:
 *                 type: integer
 *               expertiseRating:
 *                 type: integer
 *               preparationRating:
 *                 type: integer
 *               valueRating:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', verifyToken, isStudent, validate(schemas.createReview), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const studentId = req.user.id;
        const {
            bookingId,
            overallRating,
            communicationRating,
            expertiseRating,
            preparationRating,
            valueRating,
            comment
        } = req.body;

        // Verify booking exists and is completed
        const bookingResult = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND student_id = $2 AND status = $3',
            [bookingId, studentId, 'completed']
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Booking not found or not completed'
            });
        }

        const booking = bookingResult.rows[0];

        // Check if review already exists
        const existingReview = await client.query(
            'SELECT id FROM reviews WHERE booking_id = $1',
            [bookingId]
        );

        if (existingReview.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Review already exists for this booking'
            });
        }

        // Create review
        const reviewResult = await client.query(`
            INSERT INTO reviews (
                booking_id, tutor_id, student_id, overall_rating,
                communication_rating, expertise_rating, preparation_rating,
                value_rating, comment, is_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
            RETURNING *
        `, [
            bookingId, booking.tutor_id, studentId, overallRating,
            communicationRating, expertiseRating, preparationRating,
            valueRating, comment
        ]);

        const review = reviewResult.rows[0];

        // Update tutor's average rating
        await client.query(`
            UPDATE tutor_profiles 
            SET 
                average_rating = (
                    SELECT AVG(overall_rating) 
                    FROM reviews 
                    WHERE tutor_id = $1 AND moderation_status = 'approved'
                ),
                total_reviews = (
                    SELECT COUNT(*) 
                    FROM reviews 
                    WHERE tutor_id = $1 AND moderation_status = 'approved'
                )
            WHERE user_id = $1
        `, [booking.tutor_id]);

        // Create notification for tutor
        await client.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'new_review', 'New Review', $2, $3)
        `, [
            booking.tutor_id,
            'You have received a new review',
            JSON.stringify({ reviewId: review.id })
        ]);

        await client.query('COMMIT');

        logger.info(`Review created: ${review.id} by student ${studentId}`);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review'
        });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /api/reviews/tutor/{tutorId}:
 *   get:
 *     summary: Get reviews for a tutor
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/tutor/:tutorId', async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT 
                r.*,
                u.name as student_name,
                u.profile_picture as student_picture,
                b.booking_date,
                s.name as subject_name
            FROM reviews r
            INNER JOIN users u ON r.student_id = u.id
            LEFT JOIN bookings b ON r.booking_id = b.id
            LEFT JOIN subjects s ON b.subject_id = s.id
            WHERE r.tutor_id = $1 AND r.moderation_status = 'approved'
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [tutorId, limit, offset]);

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM reviews WHERE tutor_id = $1 AND moderation_status = $2',
            [tutorId, 'approved']
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

/**
 * @swagger
 * /api/reviews/{id}/response:
 *   patch:
 *     summary: Add tutor response to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.patch('/:id/response', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tutorId = req.user.id;
        const { response } = req.body;

        const result = await pool.query(`
            UPDATE reviews 
            SET 
                tutor_response = $1,
                tutor_responded_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND tutor_id = $3
            RETURNING *
        `, [response, id, tutorId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Response added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error adding review response:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding response'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { verifyToken, isTutor, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @swagger
 * /api/tutors:
 *   get:
 *     summary: Get list of tutors with filters
 *     tags: [Tutors]
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: maxRate
 *         schema:
 *           type: number
 *         description: Maximum hourly rate
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [online, in_person]
 *         description: Session format
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of tutors
 */
router.get('/', optionalAuth, validate(schemas.pagination), async (req, res) => {
    try {
        const {
            subject,
            minRating,
            maxRate,
            format,
            location,
            page = 1,
            limit = 10
        } = req.query;

        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                u.id,
                u.name,
                u.surname,
                u.profile_picture,
                tp.biography,
                tp.hourly_rate_60min,
                tp.location,
                tp.average_rating,
                tp.total_sessions,
                tp.verification_status,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', s.id,
                            'name', s.name,
                            'category', s.category
                        )
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'
                ) as subjects
            FROM users u
            INNER JOIN tutor_profiles tp ON u.id = tp.user_id
            LEFT JOIN tutor_subjects ts ON u.id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            WHERE u.role = 'tutor' 
            AND u.is_active = TRUE
            AND tp.verification_status = 'verified'
            AND tp.available_for_booking = TRUE
        `;

        const params = [];
        let paramIndex = 1;

        if (subject) {
            query += ` AND EXISTS (
                SELECT 1 FROM tutor_subjects 
                WHERE tutor_id = u.id AND subject_id = $${paramIndex}
            )`;
            params.push(subject);
            paramIndex++;
        }

        if (minRating) {
            query += ` AND tp.average_rating >= $${paramIndex}`;
            params.push(minRating);
            paramIndex++;
        }

        if (maxRate) {
            query += ` AND tp.hourly_rate_60min <= $${paramIndex}`;
            params.push(maxRate);
            paramIndex++;
        }

        if (location) {
            query += ` AND tp.location ILIKE $${paramIndex}`;
            params.push(`%${location}%`);
            paramIndex++;
        }

        query += ` 
            GROUP BY u.id, tp.user_id
            ORDER BY tp.average_rating DESC, tp.total_sessions DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(DISTINCT u.id) FROM users u INNER JOIN tutor_profiles tp ON u.id = tp.user_id WHERE u.role = $1 AND tp.verification_status = $2',
            ['tutor', 'verified']
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
        logger.error('Error fetching tutors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tutors'
        });
    }
});

/**
 * @swagger
 * /api/tutors/{id}:
 *   get:
 *     summary: Get tutor profile by ID
 *     tags: [Tutors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tutor profile
 *       404:
 *         description: Tutor not found
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.surname,
                u.email,
                u.profile_picture,
                u.created_at,
                tp.*,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', s.id,
                            'name', s.name,
                            'category', s.category,
                            'level', s.level,
                            'proficiency', ts.proficiency_level,
                            'experience', ts.years_of_experience
                        )
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'
                ) as subjects
            FROM users u
            INNER JOIN tutor_profiles tp ON u.id = tp.user_id
            LEFT JOIN tutor_subjects ts ON u.id = ts.tutor_id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            WHERE u.id = $1 AND u.role = 'tutor'
            GROUP BY u.id, tp.user_id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tutor not found'
            });
        }

        // Get recent reviews
        const reviewsResult = await pool.query(`
            SELECT 
                r.id,
                r.overall_rating,
                r.communication_rating,
                r.expertise_rating,
                r.preparation_rating,
                r.value_rating,
                r.comment,
                r.tutor_response,
                r.created_at,
                u.name as student_name,
                u.profile_picture as student_picture
            FROM reviews r
            INNER JOIN users u ON r.student_id = u.id
            WHERE r.tutor_id = $1 
            AND r.moderation_status = 'approved'
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);

        const tutor = result.rows[0];
        tutor.reviews = reviewsResult.rows;

        res.json({
            success: true,
            data: tutor
        });
    } catch (error) {
        logger.error('Error fetching tutor profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tutor profile'
        });
    }
});

/**
 * @swagger
 * /api/tutors/profile:
 *   put:
 *     summary: Update tutor profile
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               biography:
 *                 type: string
 *               location:
 *                 type: string
 *               hourlyRate60min:
 *                 type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', verifyToken, isTutor, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            biography,
            location,
            latitude,
            longitude,
            hourlyRate30min,
            hourlyRate45min,
            hourlyRate60min,
            hourlyRate90min,
            introVideoUrl
        } = req.body;

        const updateFields = [];
        const params = [];
        let paramIndex = 1;

        if (biography !== undefined) {
            updateFields.push(`biography = $${paramIndex}`);
            params.push(biography);
            paramIndex++;
        }

        if (location !== undefined) {
            updateFields.push(`location = $${paramIndex}`);
            params.push(location);
            paramIndex++;
        }

        if (latitude !== undefined) {
            updateFields.push(`latitude = $${paramIndex}`);
            params.push(latitude);
            paramIndex++;
        }

        if (longitude !== undefined) {
            updateFields.push(`longitude = $${paramIndex}`);
            params.push(longitude);
            paramIndex++;
        }

        if (hourlyRate30min !== undefined) {
            updateFields.push(`hourly_rate_30min = $${paramIndex}`);
            params.push(hourlyRate30min);
            paramIndex++;
        }

        if (hourlyRate45min !== undefined) {
            updateFields.push(`hourly_rate_45min = $${paramIndex}`);
            params.push(hourlyRate45min);
            paramIndex++;
        }

        if (hourlyRate60min !== undefined) {
            updateFields.push(`hourly_rate_60min = $${paramIndex}`);
            params.push(hourlyRate60min);
            paramIndex++;
        }

        if (hourlyRate90min !== undefined) {
            updateFields.push(`hourly_rate_90min = $${paramIndex}`);
            params.push(hourlyRate90min);
            paramIndex++;
        }

        if (introVideoUrl !== undefined) {
            updateFields.push(`intro_video_url = $${paramIndex}`);
            params.push(introVideoUrl);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(userId);

        const query = `
            UPDATE tutor_profiles 
            SET ${updateFields.join(', ')}
            WHERE user_id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error updating tutor profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get list of subjects
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [mathematics, physics, computer_science]
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [elementary, high_school, university]
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, level } = req.query;

        let query = 'SELECT * FROM subjects WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (level) {
            query += ` AND level = $${paramIndex}`;
            params.push(level);
            paramIndex++;
        }

        query += ' ORDER BY category, name';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects'
        });
    }
});

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subject details
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM subjects WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error fetching subject:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subject'
        });
    }
});

module.exports = router;

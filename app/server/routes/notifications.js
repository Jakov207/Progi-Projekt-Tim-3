const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const logger = require('../config/logger');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly = false, limit = 20 } = req.query;

        let query = `
            SELECT * FROM notifications
            WHERE user_id = $1
        `;

        const params = [userId];

        if (unreadOnly === 'true' || unreadOnly === true) {
            query += ` AND is_read = FALSE`;
        }

        query += ` ORDER BY created_at DESC LIMIT $2`;
        params.push(limit);

        const result = await pool.query(query, params);

        // Get unread count
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows,
            unreadCount: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.patch('/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            UPDATE notifications 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification'
        });
    }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(`
            UPDATE notifications 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND is_read = FALSE
        `, [userId]);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications'
        });
    }
});

module.exports = router;

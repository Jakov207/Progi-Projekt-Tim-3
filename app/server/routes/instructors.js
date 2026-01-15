const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
    try {
        const {
            search,
            teaching_type,
            max_price,
            interests
        } = req.query;

        let values = [];
        let where = ["u.is_professor = true"];

        if (search) {
            values.push(`%${search}%`);
            where.push(`(u.name ILIKE $${values.length} OR u.surname ILIKE $${values.length} OR (u.name || ' ' || u.surname) ILIKE $${values.length})`);
        }

        if (teaching_type) {
            values.push(teaching_type);
            where.push(`p.teaching_type = $${values.length}`);
        }

        if (max_price) {
            values.push(max_price);
            where.push(`p.price <= $${values.length}`);
        }

        if (interests) {
            values.push(interests.split(","));
            where.push(`
                u.id IN (
                    SELECT ui.user_id
                    FROM user_interests ui
                    JOIN interests i ON i.id = ui.interest_id
                    WHERE i.name = ANY($${values.length})
                )
            `);
        }

        const query = `
            SELECT
                u.id,
                u.name,
                u.surname,
                u.profile_picture,
                p.teaching_type,
                p.price,
                p.city,
                p.biography
            FROM users u
            JOIN professors p ON p.user_id = u.id
            WHERE ${where.join(" AND ")}
            ORDER BY u.surname
        `;

        const result = await pool.query(query, values);
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Greška kod dohvaćanja instruktora" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT
                u.id,
                u.name,
                u.surname,
                u.profile_picture,
                p.city,
                p.teaching,
                p.price,
                p.teaching_type,
                p.biography,
                p.reference,
                p.video_url,
                ARRAY_AGG(i.name) FILTER (WHERE i.name IS NOT NULL) AS interests
            FROM users u
                     JOIN professors p ON p.user_id = u.id
                     LEFT JOIN user_interests ui ON ui.user_id = u.id
                     LEFT JOIN interests i ON i.id = ui.interest_id
            WHERE u.id = $1 AND u.is_professor = true
            GROUP BY u.id, p.user_id
        `;


        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Instruktor nije pronađen" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Greška kod dohvaćanja profila instruktora" });
    }
});

module.exports = router;

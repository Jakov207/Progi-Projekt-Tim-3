const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

const requireProfessor = async (userId) => {
    const result = await pool.query(
        "SELECT is_professor FROM users WHERE id = $1",
        [userId]
    );
    return result.rows[0]?.is_professor === true;
};

const requireStudent = async (userId) => {
    const result = await pool.query(
        "SELECT is_professor FROM users WHERE id = $1",
        [userId]
    );
    return result.rows[0]?.is_professor === false;
};

// Create availability slot (professor)
router.post("/slots", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            start_time,
            end_time,
            capacity,
            teaching_type,
            price,
            location
        } = req.body;

        if (!start_time || !end_time || !teaching_type || price == null) {
            return res.status(400).json({ message: "Nedostaju obavezni podaci termina." });
        }

        if (teaching_type === "Uživo" && !location) {
            return res.status(400).json({ message: "Lokacija je obavezna za uživo nastavu." });
        }

        const isProfessor = await requireProfessor(userId);
        if (!isProfessor) {
            return res.status(403).json({ message: "Samo profesori mogu kreirati termine." });
        }

        const slotCapacity = Number.isFinite(Number(capacity)) && Number(capacity) > 0
            ? Number(capacity)
            : 1;

        const overlap = await pool.query(
            `SELECT 1
             FROM professor_slots
             WHERE professor_id = $1
               AND start_time < $3
               AND end_time > $2
             LIMIT 1`,
            [userId, start_time, end_time]
        );

        if (overlap.rows.length > 0) {
            return res.status(409).json({ message: "Termin se preklapa s postojećim." });
        }

        const result = await pool.query(
            `INSERT INTO professor_slots
             (professor_id, start_time, end_time, capacity, teaching_type, price, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
            [
                userId,
                start_time,
                end_time,
                slotCapacity,
                teaching_type,
                price,
                teaching_type === "Uživo" ? location : null
            ]
        );

        res.status(201).json({ slot: result.rows[0] });
    } catch (err) {
        console.error("Error creating slot:", err);
        res.status(500).json({ message: "Greška pri kreiranju termina." });
    }
});

// List public slots for a professor (available only)
router.get("/slots/:professorId", async (req, res) => {
    try {
        const { professorId } = req.params;
        const includeBooked = req.query.includeBooked === "true";

        const result = await pool.query(
            `SELECT
                 s.id,
                 s.start_time,
                 s.end_time,
                 s.capacity,
                 s.teaching_type,
                 s.price,
                 COUNT(b.id) AS booked_count
             FROM professor_slots s
                      LEFT JOIN professor_slot_bookings b
                                ON b.slot_id = s.id
             WHERE s.professor_id = $1
               AND s.start_time >= NOW()
             GROUP BY
                 s.id,
                 s.start_time,
                 s.end_time,
                 s.capacity,
                 s.teaching_type,
                 s.price
                 ${includeBooked ? "" : "HAVING COUNT(b.id) < s.capacity"}
             ORDER BY s.start_time`,
            [professorId]
        );

        res.json({ slots: result.rows });
    } catch (err) {
        console.error("Error fetching slots:", err);
        res.status(500).json({ message: "Greška pri dohvaćanju termina." });
    }
});

// List slots for current professor (includes booked info)
router.get("/my-slots", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isProfessor = await requireProfessor(userId);
        if (!isProfessor) {
            return res.status(403).json({ message: "Samo profesori mogu vidjeti termine." });
        }

        const result = await pool.query(
            `SELECT s.id,
                    s.start_time,
                    s.end_time,
                    s.capacity,
                    s.teaching_type,
                    s.price,
                    s.location,
                    COUNT(b.id) AS booked_count
             FROM professor_slots s
             LEFT JOIN professor_slot_bookings b ON b.slot_id = s.id
             WHERE s.professor_id = $1
             GROUP BY s.id
             ORDER BY s.start_time`,
            [userId]
        );

        res.json({ slots: result.rows });
    } catch (err) {
        console.error("Error fetching my slots:", err);
        res.status(500).json({ message: "Greška pri dohvaćanju termina." });
    }
});

// Delete available slot (professor)
router.delete("/slots/:slotId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { slotId } = req.params;

        const isProfessor = await requireProfessor(userId);
        if (!isProfessor) {
            return res.status(403).json({ message: "Samo profesori mogu brisati termine." });
        }

        const result = await pool.query(
            `DELETE FROM professor_slots
             WHERE id = $1
               AND professor_id = $2
               AND id NOT IN (
                 SELECT slot_id FROM professor_slot_bookings
               )`,
            [slotId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: "Termin nije moguće obrisati." });
        }

        res.json({ message: "Termin obrisan." });
    } catch (err) {
        console.error("Error deleting slot:", err);
        res.status(500).json({ message: "Greška pri brisanju termina." });
    }
});

// Book slot (student)
router.post("/book/:slotId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { slotId } = req.params;

        const isStudent = await requireStudent(userId);
        if (!isStudent) {
            return res.status(403).json({ message: "Samo studenti mogu rezervirati termine." });
        }

        const slotResult = await pool.query(
            `SELECT s.capacity, COUNT(b.id) AS booked_count
             FROM professor_slots s
             LEFT JOIN professor_slot_bookings b ON b.slot_id = s.id
             WHERE s.id = $1
             GROUP BY s.id`,
            [slotId]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({ message: "Termin nije pronađen." });
        }

        const { capacity, booked_count } = slotResult.rows[0];
        if (Number(booked_count) >= Number(capacity)) {
            return res.status(409).json({ message: "Termin je popunjen." });
        }

        await pool.query(
            `INSERT INTO professor_slot_bookings (slot_id, student_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [slotId, userId]
        );

        res.json({ message: "Termin rezerviran." });
    } catch (err) {
        console.error("Error booking slot:", err);
        res.status(500).json({ message: "Greška pri rezervaciji termina." });
    }
});

// Cancel booking (student)
router.delete("/book/:slotId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { slotId } = req.params;

        const isStudent = await requireStudent(userId);
        if (!isStudent) {
            return res.status(403).json({ message: "Samo studenti mogu otkazati termine." });
        }

        const result = await pool.query(
            `DELETE FROM professor_slot_bookings
             WHERE slot_id = $1 AND student_id = $2
             RETURNING id`,
            [slotId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Termin nije moguće otkazati." });
        }

        res.json({ message: "Termin otkazan." });
    } catch (err) {
        console.error("Error cancelling booking:", err);
        res.status(500).json({ message: "Greška pri otkazivanju termina." });
    }
});

// List bookings for current student
router.get("/my-bookings", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isStudent = await requireStudent(userId);
        if (!isStudent) {
            return res.status(403).json({ message: "Samo studenti mogu vidjeti rezervacije." });
        }

        const result = await pool.query(
            `SELECT s.id,
                    s.start_time,
                    s.end_time,
                    u.name AS professor_name,
                    u.surname AS professor_surname
             FROM professor_slot_bookings b
             JOIN professor_slots s ON s.id = b.slot_id
             JOIN users u ON u.id = s.professor_id
             WHERE b.student_id = $1
             ORDER BY s.start_time`,
            [userId]
        );

        res.json({ bookings: result.rows });
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: "Greška pri dohvaćanju rezervacija." });
    }
});

module.exports = router;

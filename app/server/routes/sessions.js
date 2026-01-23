// Session Records Routes - Notes, Summary, Homework
// Separated from calendar.js for better organization

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middleware/verifyToken");

// Get session record for a booking
router.get("/:bookingId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;

        // Verify user is part of this booking (student or professor)
        const bookingCheck = await pool.query(
            `SELECT b.id, b.student_id, s.professor_id
             FROM professor_slot_bookings b
             JOIN professor_slots s ON s.id = b.slot_id
             WHERE b.id = $1`,
            [bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ message: "Rezervacija nije pronađena." });
        }

        const booking = bookingCheck.rows[0];
        if (booking.student_id !== userId && booking.professor_id !== userId) {
            return res.status(403).json({ message: "Nemate pristup ovoj rezervaciji." });
        }

        const result = await pool.query(
            `SELECT student_notes, instructor_summary, homework, updated_at
             FROM session_records WHERE booking_id = $1`,
            [bookingId]
        );

        res.json({ record: result.rows[0] || null });
    } catch (err) {
        console.error("Error fetching session record:", err);
        res.status(500).json({ message: "Greška pri dohvaćanju bilješki." });
    }
});

// Update student notes
router.put("/:bookingId/notes", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        const { notes } = req.body;

        // Verify user is the student
        const bookingCheck = await pool.query(
            `SELECT student_id FROM professor_slot_bookings WHERE id = $1`,
            [bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ message: "Rezervacija nije pronađena." });
        }

        if (bookingCheck.rows[0].student_id !== userId) {
            return res.status(403).json({ message: "Samo učenik može uređivati bilješke." });
        }

        await pool.query(
            `INSERT INTO session_records (booking_id, student_notes, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (booking_id) 
             DO UPDATE SET student_notes = $2, updated_at = NOW()`,
            [bookingId, notes]
        );

        res.json({ message: "Bilješke spremljene." });
    } catch (err) {
        console.error("Error saving notes:", err);
        res.status(500).json({ message: "Greška pri spremanju bilješki." });
    }
});

// Update instructor summary and homework
router.put("/:bookingId/summary", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        const { summary, homework } = req.body;

        // Verify user is the professor
        const bookingCheck = await pool.query(
            `SELECT s.professor_id 
             FROM professor_slot_bookings b
             JOIN professor_slots s ON s.id = b.slot_id
             WHERE b.id = $1`,
            [bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({ message: "Rezervacija nije pronađena." });
        }

        if (bookingCheck.rows[0].professor_id !== userId) {
            return res.status(403).json({ message: "Samo instruktor može pisati sažetak." });
        }

        await pool.query(
            `INSERT INTO session_records (booking_id, instructor_summary, homework, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (booking_id) 
             DO UPDATE SET instructor_summary = $2, homework = $3, updated_at = NOW()`,
            [bookingId, summary, homework]
        );

        res.json({ message: "Sažetak i zadaća spremljeni." });
    } catch (err) {
        console.error("Error saving summary:", err);
        res.status(500).json({ message: "Greška pri spremanju sažetka." });
    }
});

module.exports = router;

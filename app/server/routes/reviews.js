const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const verifyToken = require("../middleware/verifyToken");
const verifyTokenOptional = require("../middleware/verifyTokenOptional");

// Get all reviews for an instructor (public)
router.get("/instructor/:instructorId", verifyTokenOptional, async (req, res) => {
    try {
        const { instructorId } = req.params;

        const query = `
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.name AS student_name,
                u.surname AS student_surname,
                u.profile_picture AS student_picture,
                i.name AS interest_name
            FROM reviews r
            JOIN users u ON u.id = r.student_id
            JOIN professor_slot_bookings psb ON psb.id = r.booking_id
            JOIN interests i ON i.id = psb.interest_id
            WHERE r.professor_id = $1
            ORDER BY r.created_at DESC
        `;

        const result = await pool.query(query, [instructorId]);

        // Calculate average rating
        const avgQuery = `
            SELECT 
                COALESCE(AVG(rating), 0) AS average_rating,
                COUNT(*) AS total_reviews
            FROM reviews 
            WHERE professor_id = $1
        `;
        const avgResult = await pool.query(avgQuery, [instructorId]);

        res.json({
            reviews: result.rows,
            average_rating: parseFloat(avgResult.rows[0].average_rating).toFixed(1),
            total_reviews: parseInt(avgResult.rows[0].total_reviews)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Greška kod dohvaćanja recenzija" });
    }
});

// Check if current user can review an instructor (has completed booking without review)
router.get("/can-review/:instructorId", verifyToken, async (req, res) => {
    try {
        const { instructorId } = req.params;
        const studentId = req.user.id;

        // Find bookings where:
        // 1. Student booked with this instructor
        // 2. The slot time has passed (lesson completed)
        // 3. No review exists yet for this booking
        const query = `
            SELECT 
                psb.id AS booking_id,
                ps.start_time,
                ps.end_time,
                i.name AS interest_name
            FROM professor_slot_bookings psb
            JOIN professor_slots ps ON ps.id = psb.slot_id
            JOIN interests i ON i.id = psb.interest_id
            WHERE psb.student_id = $1
              AND ps.professor_id = $2
              AND ps.end_time < NOW()
              AND NOT EXISTS (
                  SELECT 1 FROM reviews r WHERE r.booking_id = psb.id
              )
            ORDER BY ps.end_time DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [studentId, instructorId]);

        if (result.rows.length > 0) {
            res.json({
                can_review: true,
                booking: result.rows[0]
            });
        } else {
            res.json({
                can_review: false,
                booking: null
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Greška kod provjere mogućnosti recenzije" });
    }
});

// Submit a review
router.post("/", verifyToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const { booking_id, rating, comment } = req.body;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Ocjena mora biti između 1 i 5" });
        }

        // Verify the booking belongs to this student and is completed
        const bookingCheck = `
            SELECT 
                psb.id,
                ps.professor_id,
                ps.end_time
            FROM professor_slot_bookings psb
            JOIN professor_slots ps ON ps.id = psb.slot_id
            WHERE psb.id = $1 AND psb.student_id = $2
        `;

        const bookingResult = await pool.query(bookingCheck, [booking_id, studentId]);

        if (bookingResult.rows.length === 0) {
            return res.status(403).json({ message: "Nemate pravo ostaviti recenziju za ovaj termin" });
        }

        const booking = bookingResult.rows[0];

        // Check if lesson has been completed
        if (new Date(booking.end_time) > new Date()) {
            return res.status(400).json({ message: "Ne možete ostaviti recenziju prije završetka sata" });
        }

        // Check if review already exists
        const existingReview = await pool.query(
            "SELECT id FROM reviews WHERE booking_id = $1",
            [booking_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ message: "Već ste ostavili recenziju za ovaj termin" });
        }

        // Insert the review
        const insertQuery = `
            INSERT INTO reviews (professor_id, student_id, booking_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

        await pool.query(insertQuery, [
            booking.professor_id,
            studentId,
            booking_id,
            rating,
            comment || null
        ]);

        res.status(201).json({ message: "Recenzija uspješno dodana!" });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ message: "Već ste ostavili recenziju za ovaj termin" });
        }
        res.status(500).json({ message: "Greška kod dodavanja recenzije" });
    }
});

// Delete own review
router.delete("/:reviewId", verifyToken, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const studentId = req.user.id;

        const result = await pool.query(
            "DELETE FROM reviews WHERE id = $1 AND student_id = $2 RETURNING id",
            [reviewId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Recenzija nije pronađena ili nemate pravo za brisanje" });
        }

        res.json({ message: "Recenzija uspješno obrisana" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Greška kod brisanja recenzije" });
    }
});

module.exports = router;

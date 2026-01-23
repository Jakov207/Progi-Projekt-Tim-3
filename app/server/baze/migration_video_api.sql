-- Migration: Add video conferencing support
-- Run this on existing databases to add new columns/tables

-- Add meeting columns to professor_slots
ALTER TABLE professor_slots ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(255);
ALTER TABLE professor_slots ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(20);

-- Create session_records table
CREATE TABLE IF NOT EXISTS session_records (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES professor_slot_bookings(id) ON DELETE CASCADE,
    student_notes TEXT,
    instructor_summary TEXT,
    homework TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_session_records_booking ON session_records(booking_id);

-- Track email reminders
CREATE TABLE IF NOT EXISTS email_reminders_sent (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES professor_slot_bookings(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, reminder_type)
);

-- ============================================
-- STEM Tutor Platform - Complete Database Schema
-- ============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS favorite_tutors CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS tutor_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS tutor_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS oauth_connections CASCADE;
DROP TABLE IF EXISTS professors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Core User Tables
-- ============================================

-- Users table (enhanced)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for OAuth-only users
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    refresh_token TEXT,
    profile_picture VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (email ~* '^[A-Za-z0-9.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CHECK (role IN ('student', 'tutor', 'administrator'))
);

-- OAuth Connections (support multiple OAuth providers per user)
CREATE TABLE oauth_connections (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- 'google', 'github', 'microsoft', 'fer_aai'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Legacy students table (kept for backward compatibility)
CREATE TABLE students (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sex CHAR(1),
    city VARCHAR(100),
    education VARCHAR(255),
    date_of_birth DATE,
    CHECK (sex IN ('M', 'F', 'X')),
    CHECK (date_of_birth <= CURRENT_DATE)
);

-- Legacy professors table (kept for backward compatibility)
CREATE TABLE professors (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sex CHAR(1),
    city VARCHAR(100),
    teaching VARCHAR(255),
    date_of_birth DATE,
    CHECK (sex IN ('M', 'F', 'X')),
    CHECK (date_of_birth <= CURRENT_DATE)
);

-- ============================================
-- Enhanced Profile Tables
-- ============================================

-- Student Profiles
CREATE TABLE student_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    academic_level VARCHAR(50),  -- 'elementary', 'high_school', 'university', 'graduate'
    grade VARCHAR(20),
    institution VARCHAR(255),
    subjects_of_interest TEXT[],
    learning_preferences JSONB,  -- JSON object with preferences
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Profiles
CREATE TABLE tutor_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    biography TEXT,
    education_history JSONB,  -- Array of education entries
    hourly_rate_30min DECIMAL(10, 2),
    hourly_rate_45min DECIMAL(10, 2),
    hourly_rate_60min DECIMAL(10, 2),
    hourly_rate_90min DECIMAL(10, 2),
    online_rate DECIMAL(10, 2),
    in_person_rate DECIMAL(10, 2),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    intro_video_url VARCHAR(500),
    verification_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'verified', 'rejected'
    verification_documents JSONB,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_sessions INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    calendar_sync_enabled BOOLEAN DEFAULT FALSE,
    google_calendar_token TEXT,
    available_for_booking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- ============================================
-- Subject Management
-- ============================================

-- Subjects hierarchy
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'mathematics', 'physics', 'computer_science'
    parent_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    level VARCHAR(50),  -- 'elementary', 'high_school', 'university'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (category IN ('mathematics', 'physics', 'computer_science'))
);

-- Tutor subjects (M:N relationship)
CREATE TABLE tutor_subjects (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) DEFAULT 'intermediate',  -- 'beginner', 'intermediate', 'expert'
    years_of_experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, subject_id),
    CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert'))
);

-- ============================================
-- Booking & Scheduling
-- ============================================

-- Time slots (tutor availability)
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL,  -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    specific_date DATE,  -- For one-time slots
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CHECK (start_time < end_time)
);

-- Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    format VARCHAR(20) NOT NULL,  -- 'online', 'in_person'
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'confirmed', 'cancelled', 'completed'
    price DECIMAL(10, 2) NOT NULL,
    location VARCHAR(255),  -- For in-person sessions
    video_room_url VARCHAR(500),  -- For online sessions
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by INT REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (format IN ('online', 'in_person')),
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    CHECK (start_time < end_time),
    CHECK (price >= 0)
);

-- ============================================
-- Payment System
-- ============================================

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50),  -- 'stripe_card', 'stripe_bank'
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    refund_amount DECIMAL(10, 2) DEFAULT 0.00,
    refund_reason TEXT,
    escrow_released BOOLEAN DEFAULT FALSE,
    escrow_release_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    CHECK (amount >= 0),
    CHECK (refund_amount >= 0 AND refund_amount <= amount)
);

-- ============================================
-- Quiz & Question Bank
-- ============================================

-- Questions
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    question_type VARCHAR(20) NOT NULL,  -- 'multiple_choice', 'single_choice', 'short_answer', 'problem'
    question_text TEXT NOT NULL,
    question_latex TEXT,  -- LaTeX formatted question for math
    options JSONB,  -- Array of options for multiple/single choice
    correct_answer TEXT,
    explanation TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'medium',  -- 'easy', 'medium', 'hard'
    points INT DEFAULT 1,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (question_type IN ('multiple_choice', 'single_choice', 'short_answer', 'problem')),
    CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    CHECK (points > 0)
);

-- Quizzes
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    time_limit_minutes INT,
    total_points INT DEFAULT 0,
    passing_score INT,
    question_ids INT[],  -- Array of question IDs
    is_adaptive BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (time_limit_minutes > 0),
    CHECK (passing_score >= 0)
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    answers JSONB,  -- JSON object with question_id: answer pairs
    score INT DEFAULT 0,
    total_points INT NOT NULL,
    percentage DECIMAL(5, 2),
    passed BOOLEAN DEFAULT FALSE,
    time_taken_seconds INT,
    CHECK (score >= 0),
    CHECK (percentage >= 0 AND percentage <= 100)
);

-- ============================================
-- Notes & Homework
-- ============================================

-- Notes (private student notes)
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homework
CREATE TABLE homework (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP,
    attached_files JSONB,  -- Array of file URLs
    status VARCHAR(20) DEFAULT 'assigned',  -- 'assigned', 'submitted', 'graded'
    student_submission TEXT,
    submission_files JSONB,
    submitted_at TIMESTAMP,
    grade DECIMAL(5, 2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('assigned', 'submitted', 'graded')),
    CHECK (grade >= 0 AND grade <= 100)
);

-- ============================================
-- Reviews & Ratings
-- ============================================

-- Reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_rating INT NOT NULL,
    communication_rating INT,
    expertise_rating INT,
    preparation_rating INT,
    value_rating INT,
    comment TEXT,
    tutor_response TEXT,
    tutor_responded_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,  -- Verified booking badge
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    moderated_by INT REFERENCES users(id),
    moderated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (overall_rating >= 1 AND overall_rating <= 5),
    CHECK (communication_rating >= 1 AND communication_rating <= 5),
    CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
    CHECK (preparation_rating >= 1 AND preparation_rating <= 5),
    CHECK (value_rating >= 1 AND value_rating <= 5),
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

-- Favorite Tutors
CREATE TABLE favorite_tutors (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, tutor_id)
);

-- ============================================
-- Notifications
-- ============================================

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- 'booking_confirmed', 'booking_reminder', 'booking_cancelled', 'new_review', 'payment_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,  -- Additional data (booking_id, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Admin & Audit
-- ============================================

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,  -- 'user_created', 'tutor_verified', 'booking_cancelled', etc.
    entity_type VARCHAR(50),  -- 'user', 'booking', 'payment', etc.
    entity_id INT,
    changes JSONB,  -- JSON object with old and new values
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- OAuth connections indexes
CREATE INDEX idx_oauth_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider);

-- Tutor profiles indexes
CREATE INDEX idx_tutor_verification_status ON tutor_profiles(verification_status);
CREATE INDEX idx_tutor_rating ON tutor_profiles(average_rating DESC);
CREATE INDEX idx_tutor_location ON tutor_profiles(latitude, longitude);

-- Tutor subjects indexes
CREATE INDEX idx_tutor_subjects_tutor ON tutor_subjects(tutor_id);
CREATE INDEX idx_tutor_subjects_subject ON tutor_subjects(subject_id);

-- Bookings indexes
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Payments indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_tutor ON payments(tutor_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Reviews indexes
CREATE INDEX idx_reviews_tutor ON reviews(tutor_id);
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- Sample Data (optional, for testing)
-- ============================================

-- Insert sample subjects
INSERT INTO subjects (name, category, level, description) VALUES
    ('Algebra', 'mathematics', 'high_school', 'Basic algebra concepts'),
    ('Calculus', 'mathematics', 'university', 'Differential and integral calculus'),
    ('Linear Algebra', 'mathematics', 'university', 'Vectors, matrices, and linear transformations'),
    ('Mechanics', 'physics', 'high_school', 'Classical mechanics and motion'),
    ('Electromagnetism', 'physics', 'university', 'Electric and magnetic fields'),
    ('Python Programming', 'computer_science', 'university', 'Python programming fundamentals'),
    ('Data Structures', 'computer_science', 'university', 'Arrays, lists, trees, graphs'),
    ('Algorithms', 'computer_science', 'university', 'Sorting, searching, dynamic programming');

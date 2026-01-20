CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_professor BOOLEAN NOT NULL,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (email ~* '^[A-Za-z0-9.%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'),
        profile_picture VARCHAR(255) DEFAULT NULL
);

CREATE TABLE students (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sex CHAR(1),
        city VARCHAR(100),
        education VARCHAR(255),
        date_of_birth DATE,
        CHECK (sex IN ('M', 'F', 'X')),
        CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE TYPE teaching_type_enum AS ENUM (
    'Uživo',
    'Online',
    'Uživo i Online'
);

CREATE TABLE professors (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sex CHAR(1),
        city VARCHAR(100),
        teaching VARCHAR(255),
        date_of_birth DATE,
        biography VARCHAR(500),
        video_url VARCHAR(255),
        reference VARCHAR(500),
        teaching_type teaching_type_enum,
        CHECK (sex IN ('M', 'F', 'X')),
        CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE TYPE lesson_type_enum AS ENUM (
    '1na1',
    'Grupno'
);

CREATE TABLE interests (
                           id SERIAL PRIMARY KEY,
                           name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO interests (name) VALUES
                                 ('Matematika Osnovna Škola'),
                                 ('Fizika Osnovna Škola'),
                                 ('Informatika Osnovna Škola'),
                                 ('Matematika Srednja Škola'),
                                 ('Fizika Srednja Škola'),
                                 ('Informatika Srednja Škola');

CREATE TABLE user_interests (
                                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                interest_id INT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
                                PRIMARY KEY (user_id, interest_id)
);

-- Calendar: professor availability slots and student bookings
CREATE TABLE professor_slots (
        id SERIAL PRIMARY KEY,
        professor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        capacity INT NOT NULL DEFAULT 1,
        teaching_type teaching_type_enum NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        location VARCHAR(150),
        lesson_type lesson_type_enum NOT NULL DEFAULT '1na1',
        interest_id INT REFERENCES interests(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (end_time > start_time),
        CHECK (
        teaching_type <> 'Uživo'
        OR location IS NOT NULL
        ),
        CHECK (
            (lesson_type = '1na1' AND capacity = 1)
                OR
            (lesson_type = 'Grupno' AND capacity >= 2)
        ),
        CHECK (
            (lesson_type = '1na1' AND interest_id IS NULL)
                OR
            (lesson_type = 'Grupno' AND interest_id IS NOT NULL)
        )
);

CREATE INDEX idx_professor_slots_professor ON professor_slots(professor_id);
CREATE INDEX idx_professor_slots_start ON professor_slots(start_time);

CREATE TABLE professor_slot_bookings (
        id SERIAL PRIMARY KEY,
        slot_id INT NOT NULL REFERENCES professor_slots(id) ON DELETE CASCADE,
        student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note VARCHAR(500),
        interest_id INT REFERENCES interests(id) NOT NULL,
        booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (slot_id, student_id)
);

CREATE INDEX idx_slot_bookings_slot ON professor_slot_bookings(slot_id);
CREATE INDEX idx_slot_bookings_student ON professor_slot_bookings(student_id);
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

CREATE TABLE professors (
        user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sex CHAR(1),
        city VARCHAR(100),
        teaching VARCHAR(255),
        date_of_birth DATE,
        CHECK (sex IN ('M', 'F', 'X')),
        CHECK (date_of_birth <= CURRENT_DATE)
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
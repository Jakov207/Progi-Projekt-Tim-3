CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       is_professor BOOLEAN NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       surname VARCHAR(100) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       CHECK (email ~* '^[A-Za-z0-9.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE students (
                          user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                          sex CHAR(1),
                          city VARCHAR(100),
                          education VARCHAR(255),
                          date_of_birth DATE,
                          CHECK (sex IN ('M', 'F')),
                          CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE TABLE professors (
                            user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                            sex CHAR(1),
                            city VARCHAR(100),
                            teaching VARCHAR(255),
                            date_of_birth DATE,
                            CHECK (sex IN ('M', 'F')),
                            CHECK (date_of_birth <= CURRENT_DATE)
);

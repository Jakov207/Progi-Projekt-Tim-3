CREATE TABLE IF NOT EXISTS users (
                       id SERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       surname VARCHAR(100) NOT NULL,
                       is_professor BOOLEAN NOT NULL,
                       is_verified BOOLEAN DEFAULT FALSE NOT NULL,
                       verification_token VARCHAR(255),
                       token_expiry TIMESTAMP WITHOUT TIME ZONE,
                       created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
                          user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                          sex CHAR(1),
                          city VARCHAR(100),
                          education VARCHAR(255),
                          date_of_birth DATE,
                          CHECK (sex IN ('M', 'F')),
                          CHECK (date_of_birth <= CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS professors (
                            user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                            sex CHAR(1),
                            city VARCHAR(100),
                            teaching VARCHAR(255),
                            date_of_birth DATE,
                            CHECK (sex IN ('M', 'F')),
                            CHECK (date_of_birth <= CURRENT_DATE)
);

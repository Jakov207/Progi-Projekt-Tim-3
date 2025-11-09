CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       surname VARCHAR(100) NOT NULL,
                       birth_date DATE,
                       sex VARCHAR(10),
                       is_professor BOOLEAN NOT NULL,
                       is_verified BOOLEAN DEFAULT FALSE NOT NULL,
                       verification_token VARCHAR(255),
                       token_expiry TIMESTAMP WITHOUT TIME ZONE,
                       created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
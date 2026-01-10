# STEM Tutor Platform - Installation & Setup Guide

This guide will help you set up and run the STEM Tutor Platform on your local machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Optional (for Docker setup)
- **Docker** >= 24.0.0 ([Download](https://www.docker.com/))
- **Docker Compose** >= 2.20.0 (comes with Docker Desktop)

### Optional (for manual setup)
- **PostgreSQL** >= 16 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 7 ([Download](https://redis.io/download))

## Quick Start with Docker

This is the **recommended** method for getting started quickly.

### 1. Clone the Repository

```bash
git clone https://github.com/Jakov207/Progi-Projekt-Tim-3.git
cd Progi-Projekt-Tim-3
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example app/server/.env

# Edit the .env file with your preferred text editor
# For development, the default values should work fine
nano app/server/.env  # or use your preferred editor
```

### 3. Start All Services

```bash
# Start all containers (PostgreSQL, Redis, MinIO, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run database schema initialization
docker-compose exec postgres psql -U postgres -d stem_tutor -f /docker-entrypoint-initdb.d/schema.sql
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation (Swagger)**: http://localhost:8080/api-docs
- **MinIO Console**: http://localhost:9001 (username: minioadmin, password: minioadmin)

### 6. Stop Services

```bash
docker-compose down

# To remove all data (volumes)
docker-compose down -v
```

## Manual Setup

If you prefer not to use Docker or want more control over the setup:

### 1. Clone the Repository

```bash
git clone https://github.com/Jakov207/Progi-Projekt-Tim-3.git
cd Progi-Projekt-Tim-3
```

### 2. Install PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql-16 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (using Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Windows
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### 3. Install Redis

#### Ubuntu/Debian
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### Windows
Download from [Redis Windows Releases](https://github.com/microsoftarchive/redis/releases)

### 4. Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE stem_tutor;
CREATE USER stem_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE stem_tutor TO stem_user;
\q

# Initialize schema
psql -U stem_user -d stem_tutor -f app/server/baze/schema.sql
```

### 5. Setup Backend

```bash
cd app/server

# Install dependencies
npm install

# Configure environment
cp .env-example-server .env
# Edit .env with your database credentials and other settings
nano .env

# Start backend server
npm run dev
```

The backend will be available at http://localhost:8080

### 6. Setup Frontend

Open a new terminal window:

```bash
cd app/client

# Install dependencies
npm install

# Configure environment (optional)
cp .env-example-client .env
# Edit if you need to change the API URL
nano .env

# Start frontend development server
npm run dev
```

The frontend will be available at http://localhost:5173

## Configuration

### Backend Environment Variables

Edit `app/server/.env`:

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stem_tutor
DB_USER=stem_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (generate secure random strings for production)
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

### Frontend Environment Variables

Edit `app/client/.env`:

```env
VITE_API_URL=http://localhost:8080
```

### Generate Secure Secrets

For production, generate secure random strings:

```bash
# Generate JWT secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

## Running the Application

### Development Mode

#### Backend
```bash
cd app/server
npm run dev
```
The server will restart automatically on code changes.

#### Frontend
```bash
cd app/client
npm run dev
```
The app will hot-reload on code changes.

### Production Build

#### Backend
```bash
cd app/server
npm start
```

#### Frontend
```bash
cd app/client
npm run build
npm run preview
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 8080 (backend)
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list  # macOS
   ```

2. Check connection settings in `.env`

3. Test connection:
   ```bash
   psql -U stem_user -d stem_tutor -h localhost
   ```

### Redis Connection Issues

1. Verify Redis is running:
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

2. Check Redis logs:
   ```bash
   tail -f /var/log/redis/redis-server.log  # Linux
   ```

### Docker Issues

1. Check if containers are running:
   ```bash
   docker-compose ps
   ```

2. View logs for specific service:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs postgres
   ```

3. Rebuild containers:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### NPM Installation Issues

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Permission Issues (Linux)

If you get permission errors with Docker:

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
```

## Testing

### Run Backend Tests
```bash
cd app/server
npm test
```

### Run Frontend Tests
```bash
cd app/client
npm test
```

### Run Linters
```bash
# Backend
cd app/server
npm run lint

# Frontend
cd app/client
npm run lint
```

## Next Steps

After successful installation:

1. **Create your first admin user** through the registration page
2. **Explore the API documentation** at http://localhost:8080/api-docs
3. **Check the README.md** for feature documentation
4. **Review the code** in `app/server/routes` and `app/client/src`

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Jakov207/Progi-Projekt-Tim-3/issues)
- **Email**: support@fertutor.xyz
- **Documentation**: http://localhost:8080/api-docs (when running)

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)

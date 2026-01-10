# STEM Tutor Platform

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

Platforma za Online Instrukcije - projekt iz kolegija Programsko inženjerstvo (ak. god. 2025./2026.)

**Live URL:** [fertutor.xyz](https://fertutor.xyz)

## 📋 Opis Projekta

STEM Tutor Platform je moderna web aplikacija koja povezuje studente s privatnim instruktorima iz područja matematike, fizike i računalnih znanosti. Platforma omogućava:

- **Pretraživanje i rezervaciju instruktora** - filtriranje po predmetima, cijeni, lokaciji i ocjenama
- **Online i osobne sesije** - video pozivi putem Jitsi Meet API, interaktivna ploča (Excalidraw), chat
- **Sustav plaćanja** - integracija sa Stripe-om s escrow modelom
- **Kvizovi i banka pitanja** - adaptivni algoritmi temeljeni na učinku studenata
- **Ocjene i recenzije** - sustav ocjenjivanja s verifikacijom rezervacija
- **Real-time obavijesti** - WebSocket, email i push notifikacije
- **Admin dashboard** - upravljanje korisnicima, verificiranje instruktora, analitika

## 👥 Članovi Tima

*   **[Jakov Mršić](https://github.com/Jakov207)** - *Voditelj* - [jakov.mrsic@fer.unizg.hr](mailto:jakov.mrsic@fer.unizg.hr)
*   **[Fran Kovačević](https://github.com/FranKovacevic)** - *Back-end* - [fran.kovacevic@fer.unizg.hr](mailto:fran.kovacevic@fer.unizg.hr)
*   **[Stjepan Martinović](https://github.com/stjepanmmm)** - *Baze/Front-end* - [stjepan.martinovic@fer.unizg.hr](mailto:stjepan.martinovic@fer.unizg.hr)
*   **[Mihael Grgurić]()** - *Back-end* - [mihael.grguric@fer.unizg.hr](mailto:mihael.grguric@fer.unizg.hr)
*   **[Jure Šestić]()** - *Front-end* - [jure.sestic@fer.unizg.hr](mailto:jure.sestic@fer.unizg.hr)
*   **[Ian Tomas]()** - *UI Design/Tester* - [ian.tomas@fer.unizg.hr](mailto:ian.tomas@fer.unizg.hr)

## 🚀 Tehnologije

### Backend
- **Node.js** - runtime environment
- **Express.js** - web framework
- **PostgreSQL 16** - relational database
- **Redis** - caching and session management
- **Socket.io** - real-time communication
- **Stripe** - payment processing
- **JWT** - authentication tokens
- **Winston** - logging
- **Zod** - input validation
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 19** - UI library
- **Redux Toolkit** - state management
- **Tailwind CSS** - styling
- **Vite** - build tool
- **Axios** - HTTP client
- **Socket.io Client** - real-time updates
- **Leaflet** - maps integration
- **React Router** - routing

### DevOps & Infrastructure
- **Docker & Docker Compose** - containerization
- **MinIO** - S3-compatible file storage
- **GitHub Actions** - CI/CD
- **Jitsi Meet API** - video conferencing

## 🏗️ Struktura Projekta

```
Progi-Projekt-Tim-3/
├── app/
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── services/      # API services
│   │   │   ├── store/         # Redux store
│   │   │   └── utils/         # Utility functions
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── server/                # Node.js backend
│       ├── config/            # Configuration files
│       ├── middleware/        # Express middleware
│       ├── routes/            # API routes
│       ├── baze/              # Database schemas
│       ├── public/            # Static files
│       ├── templates/         # Email templates
│       ├── logs/              # Application logs
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml         # Docker services
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 📦 Instalacija

### Preduvjeti

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** >= 24.0.0 (opciono)
- **Docker Compose** >= 2.20.0 (opciono)
- **PostgreSQL** >= 16 (ako ne koristite Docker)
- **Redis** >= 7 (ako ne koristite Docker)

### Brza Instalacija s Docker-om (Preporučeno)

1. **Klonirajte repozitorij:**
   ```bash
   git clone https://github.com/Jakov207/Progi-Projekt-Tim-3.git
   cd Progi-Projekt-Tim-3
   ```

2. **Kopirajte i konfigurirajte environment varijable:**
   ```bash
   cp .env.example app/server/.env
   # Uredite app/server/.env prema potrebi
   ```

3. **Pokrenite Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Inicijalizirajte bazu podataka:**
   ```bash
   docker-compose exec postgres psql -U postgres -d stem_tutor -f /docker-entrypoint-initdb.d/schema.sql
   ```

5. **Pristupite aplikaciji:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/api-docs
   - MinIO Console: http://localhost:9001

### Manualna Instalacija

#### Backend Setup

1. **Instalirajte PostgreSQL i Redis:**
   ```bash
   # Na Ubuntu/Debian:
   sudo apt-get install postgresql-16 redis-server
   
   # Na macOS:
   brew install postgresql@16 redis
   ```

2. **Kreirajte bazu podataka:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE stem_tutor;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE stem_tutor TO postgres;
   \q
   ```

3. **Inicijalizirajte shemu:**
   ```bash
   psql -U postgres -d stem_tutor -f app/server/baze/schema.sql
   ```

4. **Konfigurirajte backend:**
   ```bash
   cd app/server
   cp .env-example-server .env
   # Uredite .env prema vašim postavkama
   npm install
   ```

5. **Pokrenite server:**
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. **Konfigurirajte frontend:**
   ```bash
   cd app/client
   cp .env-example-client .env
   # Postavite VITE_API_URL na URL vašeg backend servera
   npm install
   ```

2. **Pokrenite klijent:**
   ```bash
   npm run dev
   ```

## 🔧 Konfiguracija

### Environment Varijable

Kopirajte `.env.example` u `app/server/.env` i konfigurirajte sljedeće:

#### Osnovna Konfiguracija
```env
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

#### Baza Podataka
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stem_tutor
DB_USER=postgres
DB_PASSWORD=postgres
```

#### JWT Tokeni
```env
JWT_SECRET=your-strong-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

#### OAuth Provideri
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Za potpunu listu environment varijabli, pogledajte `.env.example`.

## 📚 API Dokumentacija

API dokumentacija je dostupna putem Swagger UI:

- **Development:** http://localhost:8080/api-docs
- **Production:** https://fertutor.xyz/api-docs

### Glavni Endpointi

#### Autentikacija
- `POST /api/auth/register` - Registracija novog korisnika
- `POST /api/auth/login` - Prijava korisnika
- `POST /api/auth/logout` - Odjava korisnika
- `POST /api/auth/google` - Google OAuth prijava
- `POST /api/auth/forgot-password` - Zahtjev za reset lozinke
- `POST /api/auth/reset-password` - Reset lozinke

#### Korisnici
- `GET /api/users/:id` - Dohvati korisnika
- `PUT /api/users/:id` - Ažuriraj profil
- `DELETE /api/users/:id` - Obriši račun

#### Instruktori
- `GET /api/tutors` - Lista instruktora (s filterima)
- `GET /api/tutors/:id` - Profil instruktora
- `POST /api/tutors` - Kreiraj instruktor profil
- `PUT /api/tutors/:id` - Ažuriraj profil

#### Rezervacije
- `GET /api/bookings` - Lista rezervacija
- `POST /api/bookings` - Nova rezervacija
- `PUT /api/bookings/:id` - Ažuriraj rezervaciju
- `DELETE /api/bookings/:id` - Otkaži rezervaciju

#### Plaćanja
- `POST /api/payments/intent` - Kreiraj payment intent (Stripe)
- `GET /api/payments/:id` - Status plaćanja

Za detalje svih endpointa, pogledajte Swagger dokumentaciju.

## 🧪 Testiranje

```bash
# Backend testovi
cd app/server
npm test

# Frontend testovi
cd app/client
npm test

# E2E testovi
npm run test:e2e
```

## 🚀 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build frontend:**
   ```bash
   cd app/client
   npm run build
   ```

2. **Postavite environment varijable za production:**
   ```bash
   NODE_ENV=production
   ```

3. **Pokrenite server:**
   ```bash
   cd app/server
   npm start
   ```

## 🔒 Sigurnost

- **HTTPS only** u produkciji
- **Rate limiting** - zaštita od brute-force napada
- **Input validation** - Zod validacija svih unosa
- **SQL injection prevention** - parametrizirani upiti
- **XSS prevention** - sanitizacija HTML-a
- **CSRF protection** - CSRF tokeni
- **JWT tokens** - 15min access token, 7-day refresh token
- **Password hashing** - bcrypt s 10 rounds
- **GDPR compliance** - izvoz i brisanje podataka

## 📝 Funkcijski Zahtjevi

### Student
- ✅ Registracija i prijava (email/OAuth)
- ✅ Pretraživanje instruktora po predmetima, cijeni, lokaciji
- ✅ Pregled profila instruktora s ocjenama
- ✅ Rezervacija instrukcija (online/osobno)
- ✅ Plaćanje putem Stripe-a
- ✅ Sudjelovanje u video sesijama
- ✅ Pisanje recenzija
- ✅ Spremanje omiljenih instruktora

### Instruktor (Tutor)
- ✅ Kreiranje i uređivanje profila
- ✅ Postavljanje rasporeda dostupnosti
- ✅ Prihvaćanje/odbijanje rezervacija
- ✅ Vođenje online sesija
- ✅ Zadavanje zadaća
- ✅ Praćenje zarade

### Administrator
- ✅ Upravljanje korisnicima
- ✅ Verifikacija instruktora
- ✅ Moderacija recenzija
- ✅ Pregled analitike
- ✅ Audit logovi

## 🤝 Doprinos

1. Fork repozitorij
2. Kreirajte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit promjene (`git commit -m 'Add some AmazingFeature'`)
4. Push na branch (`git push origin feature/AmazingFeature`)
5. Otvorite Pull Request

## 📄 Licenca

Ovaj repozitorij sadrži otvoreni obrazovni sadržaj (eng. Open Educational Resources) i licenciran je prema pravilima Creative Commons licencije koja omogućava da preuzmete djelo, podijelite ga s drugima uz uvjet da navođenja autora, ne upotrebljavate ga u komercijalne svrhe te dijelite pod istim uvjetima [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License HR](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.hr).

**Napomena:**
Svi paketi distribuiraju se pod vlastitim licencama. Svi upotrijebljeni materijali (slike, modeli, animacije, ...) distribuiraju se pod vlastitim licencama.

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.hr
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png

## 📞 Kontakt

Za pitanja i podršku:
- Email: support@fertutor.xyz
- GitHub Issues: [Otvori issue](https://github.com/Jakov207/Progi-Projekt-Tim-3/issues)

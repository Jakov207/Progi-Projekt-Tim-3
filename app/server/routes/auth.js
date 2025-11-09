const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../config/email');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ažurirajte putanju ovisno o strukturi!
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'verification.html');
let verificationTemplate;
try {
    verificationTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
} catch (e) {
    console.error('FATALNA GREŠKA: Ne mogu učitati email predložak:', TEMPLATE_PATH);
}


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
}

const generateToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

const getTokenExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000).toISOString();
}

function isEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
    return passwordRegex.test(password);
}


// RUTA 1: UNOS EMAILA I SLANJE POTVRDE
router.post('/register/email', async (req, res) => {
    const { email } = req.body;

    if (!email || !isEmail(email)) {
        return res.status(400).json({ message: 'Molimo unesite ispravnu email adresu.' });
    }

    try {
        const userExists = await pool.query('SELECT is_verified FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0 && userExists.rows[0].is_verified) {
            return res.status(400).json({ message: 'Korisnik s ovim emailom već postoji i potvrđen je.' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = getTokenExpiry();

        if (userExists.rows.length === 0) {
            await pool.query(
                'INSERT INTO users (email, is_verified, verification_token, token_expiry) VALUES ($1, FALSE, $2, $3)',
                [email, verificationToken, tokenExpiry]
            );
        } else {
            await pool.query(
                'UPDATE users SET verification_token = $1, token_expiry = $2 WHERE email = $3',
                [verificationToken, tokenExpiry, email]
            );
        }

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const emailHtml = verificationTemplate.replace(/{{verificationLink}}/g, verificationLink);

        await sendEmail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Potvrda Registracije | Fertutor.xyz',
            html: emailHtml,
        });

        return res.status(202).json({ message: 'Link za potvrdu poslan je na vaš email. Molimo provjerite sandučić.' });

    } catch (error) {
        console.error('Greška kod registracije (Korak 1):', error);
        return res.status(500).json({ message: 'Interna greška servera.' });
    }
});


// RUTA 2: PROVJERA TOKENA I POTVRDA EMAILA
router.post('/verify-token', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token nije pronađen.' });
    }

    try {
        const userResult = await pool.query(
            'SELECT id, email, is_verified, token_expiry FROM users WHERE verification_token = $1',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Nevažeći token.' });
        }

        const user = userResult.rows[0];

        if (new Date(user.token_expiry) < new Date()) {
            await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
            return res.status(400).json({ message: 'Token je istekao. Molimo ponovno se registrirajte.' });
        }

        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = $1',
            [user.id]
        );

        return res.status(200).json({
            message: 'Email uspješno potvrđen.',
            email: user.email
        });

    } catch (error) {
        console.error('Greška kod potvrde tokena:', error);
        return res.status(500).json({ message: 'Interna greška servera.' });
    }
});


// RUTA 3: FINALIZACIJA REGISTRACIJE (POSTAVLJANJE LOZINKE I DETALJA)
router.post('/finish-register', async (req, res) => {
    // Koristimo is_student flag
    const { email, password, passwordCheck, name, surname, is_student, termsAndConditions } = req.body;

    if (!email || !password || !name || surname === undefined || is_student === undefined || !termsAndConditions) {
        return res.status(400).json({ message: 'Molimo upišite podatke u sva obavezna polja i prihvatite uvjete.' });
    }
    if (!isPassword(password) || password !== passwordCheck) {
        return res.status(400).json({ message: 'Lozinka je neispravnog formata ili se lozinke ne podudaraju.' });
    }

    try {
        const userResult = await pool.query(
            'SELECT id, is_verified, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_verified) {
            return res.status(403).json({ message: 'Email nije potvrđen ili ne postoji. Ponovite prvi korak registracije.' });
        }

        if (userResult.rows[0].password_hash) {
            return res.status(400).json({ message: 'Račun je već kompletiran. Nastavite na prijavu.' });
        }

        const userId = userResult.rows[0].id;
        const hashedPassword = await bcrypt.hash(password, 10);

        // IZRAČUN is_professor: Ako NIJE student, onda JE profesor
        const isProfessor = !is_student;

        // Ažuriraj redak s finalnim obaveznim podacima
        // Baza očekuje is_professor (Boolean)
        const updatedUser = await pool.query(
            'UPDATE users SET password_hash = $1, name = $2, surname = $3, is_professor = $4, updated_at = NOW() WHERE id = $5 RETURNING id, name, surname, email, is_professor',
            [hashedPassword, name, surname, isProfessor, userId]
        );

        const token = generateToken(userId);

        res.cookie('token', token, cookieOptions);

        return res.status(201).json({
            message: 'Račun je uspješno kreiran i prijavljeni ste.',
            user: updatedUser.rows[0]
        });

    } catch (error) {
        console.error('Greška kod finalizacije registracije:', error);
        return res.status(500).json({ message: 'Interna greška servera.' });
    }
});


// LOGIN RUTA
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Molimo upišite podatke u sva polja'});
    }

    const user = await pool.query('SELECT id, password_hash, is_verified FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({message: 'Krivi podaci za login'});
    }

    const userData = user.rows[0];

    if (!userData.is_verified) {
        return res.status(403).json({message: 'Vaš račun nije potvrđen. Molimo provjerite email.'});
    }

    const isMatch = await bcrypt.compare(password, userData.password_hash);

    if (!isMatch) {
        return res.status(400).json({message: 'Krivi podaci za login'});
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);

    return res.status(201).json({ message: 'Uspješan login'});
})


// LOGOUT RUTA
router.post('/logout',  (req, res) => {
    res.cookie('token', '', {...cookieOptions, maxAge: 1});
    res.json({ message: 'Logged out'});
})

module.exports = router;
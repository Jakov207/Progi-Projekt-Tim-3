const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../config/email');
const fs = require('fs');
const path = require('path');
const verifyToken = require("../middleware/verifyToken");
const { OAuth2Client } = require("google-auth-library");
const { upload, compressImage } = require('../middleware/upload');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'verification.html');
let verificationTemplate;
try {
    verificationTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
} catch (e) {
    console.error('FATALNA GREŠKA: Ne mogu učitati email predložak:', TEMPLATE_PATH);
}

const cookieOptionsRemember = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
}

const cookieOptionsNoRemember = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
}

const generateLoginToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

const generateVerifyToken = (email, password_hash) => {
    return jwt.sign(
        { email, password_hash },
        process.env.VERIFY_SECRET,
        { expiresIn: '1h' }
    );
};

const generateResetPassToken = (id, email) => {
    return jwt.sign(
        { id, email },
        process.env.RESET_SECRET,
        { expiresIn: '15m' }
    );
};

function isEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
    return passwordRegex.test(password);
}

// RUTA 1: UNOS EMAILA I LOZINKE
router.post('/register', async (req, res) => {
    const { email, password, passwordCheck, termsAndConditions} = req.body;

    if (!email || !isEmail(email)) {
        return res.status(400).json({ message: 'Molimo unesite ispravnu email adresu.' });
    }

    if(!password || !isPassword(password)) {
        return res.status(400).json({message: "Lozinka mora imati 8-32 znakova, veliko i malo slovo, broj i specijalni znak."});
    }

    if (!passwordCheck || password !== passwordCheck) {
        return res.status(400).json({ message: 'Lozinke se ne podudaraju.' });
    }

    if (!termsAndConditions) {
        return res.status(400).json({message: "moras prihvatiti TaC"});
    }

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0 ) {
        return res.status(400).json({ message: 'Korisnik s ovim emailom već postoji.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const token = generateVerifyToken(email, password_hash);
    const verificationLink = `${process.env.FRONTEND_URL}/api/auth/verify-token?token=${token}`;
    const emailHtml = verificationTemplate.replace(/{{verificationLink}}/g, verificationLink);

    const sent = await sendEmail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Potvrda Registracije | Fertutor.xyz',
        html: emailHtml
    });

    if(!sent) {
        return res.status(500).json({message: "slanje emaila neuspjesno"});
    }

    return res.status(202).json({ message: 'Link za potvrdu poslan je na vaš email. Molimo provjerite sandučić.' });
});

// RUTA 2: PROVJERA TOKENA
router.get('/verify-token', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token nije pronađen.' });
    }

    try {
        jwt.verify(token, process.env.VERIFY_SECRET);
        return res.redirect(`${process.env.FRONTEND_URL}/finish-register?token=${token}`);
    } catch (err) {
        return res.status(400).json({ message: 'Token je nevažeći ili je istekao.' });
    }
});

// RUTA 3: FINALIZACIJA REGISTRACIJE + UPLOAD SLIKE
router.post('/finish-register', upload.single('profileImage'), async (req, res) => {
    const { token, name, surname, date_of_birth, sex, is_professor, city, education } = req.body;

    if (!token) return res.status(400).json({message: "Istekao token"});
    if (!name || !surname || !date_of_birth || !sex || typeof is_professor === "undefined" || !city || !education) {
        return res.status(400).json({ message: 'Molimo unesite podatke u sva polja.' });
    }

    let parsed;
    try {
        parsed = jwt.verify(token, process.env.VERIFY_SECRET);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const profilePicture = req.file ? req.file.filename : null;

    // Komprimiraj sliku ako postoji
    if (profilePicture) {
        const filePath = path.join(__dirname, '../uploads/profiles', profilePicture);
        await compressImage(filePath);
    }

    await pool.query(
        'INSERT INTO users (email, password_hash, is_professor, name, surname, profile_picture) VALUES ($1, $2, $3, $4, $5, $6)',
        [parsed.email, parsed.password_hash, is_professor === 'true', name, surname, profilePicture]
    );

    const id = await pool.query('SELECT id FROM users WHERE email = $1', [parsed.email]);
    const user_id = id.rows[0].id;

    if (is_professor === 'true') {
        await pool.query(
            'INSERT INTO professors (user_id, sex, city, teaching, date_of_birth) VALUES ($1, $2, $3, $4, $5)',
            [user_id, sex, city, education, date_of_birth]
        );
    } else {
        await pool.query(
            'INSERT INTO students (user_id, sex, city, education, date_of_birth) VALUES ($1, $2, $3, $4, $5)',
            [user_id, sex, city, education, date_of_birth]
        );
    }

    return res.status(200).json({message: "Profil je dovršen!"});
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password, rememberLogin } = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Molimo upišite podatke u sva polja'});
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
        return res.status(400).json({message: 'ne postoji korisnik s tim emailom'});
    }

    const userData = user.rows[0];
    const isMatch = await bcrypt.compare(password, userData.password_hash);
    if (!isMatch) {
        return res.status(400).json({message: 'Krivi podaci za login'});
    }

    const token = generateLoginToken(userData.id);
    if (rememberLogin) {
        res.cookie('token', token, cookieOptionsRemember);
    } else {
        res.cookie('token', token, cookieOptionsNoRemember);
    }

    return res.status(200).json({
        message: 'uspjesan login',
        user: {
            email: userData.email,
            name: userData.name,
            surname: userData.surname,
            is_professor: userData.is_professor
        }
    });
});

// LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    return res.json({ message: 'Uspjesan logout' });
});

// ME
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await pool.query('SELECT id, email, name, surname, is_professor FROM users WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) return res.status(404).json({ message: 'Korisnik nije pronađen' });
        res.json({ user: user.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Greška na serveru' });
    }
});

// FORGOT PASSWORD
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    if (!email || !isEmail(email)) {
        return res.status(400).json({ message: 'Unesite ispravnu email adresu.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
        return res.status(200).json({message: 'Ako postoji korisnik, poslan je email'});
    }

    const userData = user.rows[0];
    const resetPassToken = generateResetPassToken(userData.id, email);
    const resetLink = `${process.env.FRONTEND_URL}/api/auth/verify-reset-token?token=${resetPassToken}`;

    const resetTemplatePath = path.join(__dirname, '..', 'templates', 'reset_password.html');
    let resetHtml = fs.readFileSync(resetTemplatePath, 'utf8');
    resetHtml = resetHtml.replace(/{{resetLink}}/g, resetLink);

    const sent = await sendEmail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Resetiranje lozinke | Fertutor.xyz",
        html: resetHtml
    });

    if (!sent) {
        return res.status(500).json({ message: "Greška pri slanju emaila." });
    }

    return res.status(200).json({
        message: "Ako postoji korisnik, poslan je email"
    });
});

// VERIFY RESET TOKEN
router.get('/verify-reset-token', async (req, res) => {
    const { token } = req.query;

    if (!token) return res.status(400).json({ message: "Token nije pronađen." });

    try {
        jwt.verify(token, process.env.RESET_SECRET);
        return res.redirect(`${process.env.FRONTEND_URL}/reset-password?token=${token}`);
    } catch (err) {
        return res.status(400).json({ valid: false, message: "Token istekao ili neispravan." });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { token, password, passwordCheck } = req.body;

    if (!token) return res.status(400).json({ message: "Token nedostaje." });
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.RESET_SECRET);
    } catch (err) {
        return res.status(400).json({ message: "Token istekao ili neispravan." });
    }

    if(!password || !isPassword(password)) {
        return res.status(400).json({message: "Lozinka mora imati 8-32 znakova, veliko i malo slovo, broj i specijalni znak."});
    }
    if (!passwordCheck || password !== passwordCheck) {
        return res.status(400).json({ message: 'Lozinke se ne podudaraju.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await pool.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [hashed, decoded.id]
    );

    return res.status(200).json({ message: "Lozinka uspješno promijenjena." });
});

// GOOGLE LOGIN
router.post('/google-login', async (req, res) => {
    const { credential } = req.body;

    if(!credential) return res.status(400).json({message: "credential nedostaje"});

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email;

        let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            await pool.query(
                'INSERT INTO users (email, password_hash, is_professor, name, surname) VALUES ($1, $2, $3, $4, $5)',
                [email, '', false, payload.given_name || '', payload.family_name || '']
            );
            user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        }

        const userData = user.rows[0];
        const token = generateLoginToken(userData.id);
        res.cookie('token', token, cookieOptionsRemember);

        return res.status(200).json({
            message: 'uspjesan login',
            user: {
                email: userData.email,
                name: userData.name,
                surname: userData.surname,
                is_professor: userData.is_professor
            }
        });

    } catch (err) {
        return res.status(400).json({message: "Neispravan Google ID token"});
    }
});

module.exports = router;
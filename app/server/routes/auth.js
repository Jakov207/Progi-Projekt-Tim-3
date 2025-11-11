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

//CookieOptions kada korisnik stisne zapamti me kod login-a
const cookieOptionsRemember = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 dana
}

//CookieOptions kada korisnike ne zeli zapamceni login
const cookieOptionsNoRemember = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
}

const generateToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

const getTokenExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000);
}

//provjerava ispravan unos emaila
function isEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

//provjera ispravnog unosa lozinke
function isPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/;
    return passwordRegex.test(password);
}


// RUTA 1: UNOS EMAILA I SLANJE POTVRDE
router.post('/register/email', async (req, res) => {
    const { email, name, surname,  is_professor, password} = req.body;

    if (!email || !isEmail(email)) {
        return res.status(400).json({ message: 'Molimo unesite ispravnu email adresu.' });
    }
    if(!password || !isPassword(password)) {
        return res.status(400).json({message: "Lozinka mora imati 8-32 znakova, veliko i malo slovo, broj i specijalni znak."});
    }
    if(!name ||!surname || typeof is_professor === 'undefined') {
        return res.status(400).json({message: "nedostaju podaci"})
    }

    try {
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0 ) {
            return res.status(400).json({ message: 'Korisnik s ovim emailom već postoji.' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = getTokenExpiry();

        await pool.query(
                'INSERT INTO users (email, is_verified, token_expiry, verification_token, name, surname, is_professor, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [email, false, tokenExpiry, verificationToken, name, surname, is_professor, password_hash]
            );

        const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-token?token=${verificationToken}`;
        const emailHtml = verificationTemplate.replace(/{{verificationLink}}/g, verificationLink);

        const sent = await sendEmail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Potvrda Registracije | Fertutor.xyz',
            html: emailHtml
        });
        console.log("mail je poslan? ", sent);
        if(!sent) {
            return res.status(500).json({message: "slanje emaila neuspjesno"});
        }

        return res.status(202).json({ message: 'Link za potvrdu poslan je na vaš email. Molimo provjerite sandučić.' });

    } catch (error) {
        console.error('Greška kod registracije (Korak 1):', error);
        return res.status(500).json({ message: 'Interna greška servera.' });
    }
});


// RUTA 2: PROVJERA TOKENA I POTVRDA EMAILA
router.get('/verify-token', async (req, res) => {
    const { token } = req.query;

    console.log("token: ", token);

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


        if (user.token_expiry < new Date()) {
            await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
            return res.status(400).json({ message: 'Token je istekao. Molimo ponovno se registrirajte.' });
        }

        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = $1',
            [user.id]
        );

        return res.redirect(
            `${process.env.FRONTEND_URL}/finish-register?email=${user.email}`
        );

    } catch (error) {
        console.error('Greška kod potvrde tokena:', error);
        return res.status(500).json({ message: 'Interna greška servera.' });
    }
});


// RUTA 3: FINALIZACIJA REGISTRACIJE (POSTAVLJANJE LOZINKE I DETALJA)
router.post('/finish-register', async (req, res) => {
    // Koristimo is_student flag
    try {
        const {sex, city, teaching, education, date_of_birth, termsAndConditions} = req.body;

        const email = req.body.email || req.query.email;
        console.log("email: ", email);

        const user = await pool.query('SELECT * FROM users  WHERE email = $1', [email]);

        if (!termsAndConditions) {
            return res.status(400).json({message: "moras prihvatiti TaC"});
        }
        console.log(user.rows[0]);

        if (user.rows[0].is_professor) {
            await pool.query('INSERT INTO  professors (sex, city, teaching, date_of_birth) VALUES ($1, $2, $3, $4)',
                [sex, city, teaching, date_of_birth]);
        } else {
            await pool.query('INSERT INTO  students (sex, city, education, date_of_birth) VALUES ($1, $2, $3, $4)',
                [sex, city, teaching, date_of_birth]);
        }

        return res.status(200).json({ message: "Profil uspješno dovršen." });
    }
 catch (err) {
    console.error("finish-register ERROR:", err);
    return res.status(500).json({ message: "Server error" });
}
});





//login
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

    if (!userData.is_verified) {
        return res.status(403).json({message: 'Vaš račun nije potvrđen. Molimo provjerite email.'});
    }

    const isMatch = await bcrypt.compare(password, userData.password_hash);

    if (!isMatch) {
        return res.status(400).json({message: 'Krivi podaci za login'});
    }

    const token = generateToken(userData.id);

    if (!rememberLogin) {
        res.cookie('token', token, cookieOptionsNoRemember);
    }
    else {
        res.cookie('token', token, cookieOptionsRemember);
    }


    return res.status(200).json({
        message: 'uspjesan login',
        user:user
    });
})//mora biti jedan odgovor u expressu


//logout
router.post('/logout',  (req, res) => {
    req.session?.destroy(()=> {});
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    return res.json({ message: 'Uspjesan logout' });
});

module.exports = router;
const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

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

//registriranje novog korisnika 1.korak (email, password)
router.post('/register', async (req, res) => {
    const { email, password, passwordCheck, termsAndConditions } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Molimo upišite podatke u sva polja' });
    }

    if (!isEmail(email)) {
        return res.status(400).json({ message: 'Molimo upišite ispravan email' });
    }

    if(password !== passwordCheck) {
        return res.status(400).json({ message: 'Lozinke se ne podudaraju' });
    }

    if (!isPassword(password)) {
        return res.status(400).json({ message: 'Molimo upišite lozinku u ispravnom formatu' });
    }

    if (!termsAndConditions) {
        return res.status(400).json({ message: 'Morate se složiti sa uvjetima korištenja za registraciju' });
    }


    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'Korisnik već postoji'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    req.session.userData = {
        email: email,
        password: hashedPassword
    };

    return res.status(200).json({ message: 'Usprešan prvi dio registracije'});

    //dodati redirect to /register2
})

//registriranje novog korisnika 2.korak
router.post('/register2', async (req, res) => {
    const { name, surname, birth_date, sex, is_professor } = req.body;

    const userData = req.session.userData;
    if (!userData) {
        return res.status(400).json({ message: 'Sesija je istekla ponovite registraciju'})
    }

    if (!name || !surname || !is_professor) {
        return res.status(400).json({message: 'Molimo upišite podatke u obavezna polja'})
    }

    const newUser = await pool.query(
        'INSERT INTO users (email, password_hash, name, surname, is_professor) VALUES ($1, $2, $3, $4, $5) RETURNING name, surname, email, is_professor',
        [userData.email, userData.password, name, surname, is_professor]
    )

    req.session.userData = null;

    const token = generateToken(newUser.rows[0].id);

    res.cookie('token', token, cookieOptionsNoRemember);

    return res.status(201).json({ user: newUser.rows[0] });

    //redirect negdje
})


//login
router.post('/login', async (req, res) => {
    const { email, password, rememberLogin } = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Molimo upišite podatke u sva polja'});
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({message: 'Krivi podaci za login'});
    }

    const userData = user.rows[0];

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


    //res.json({user: {id: userData.id, name: userData.name, surname: userData.surname, email: userData.email}});

    return res.status(201).json({ message: 'Uspješan login'});

    //redirect negdje
})


//logout
router.post('/logout',  (req, res) => {
    res.cookie('token', '', {...cookieOptions, maxAge: 1});
    res.json({ message: 'Logged out'});

    //redirect na homepage
})

module.exports = router;
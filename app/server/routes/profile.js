const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/verifyToken');


router.get('/', verifyToken, async (req, res) => {
    try{
        userId = req.user.id;

        const result = await pool.query('SELECT name, surname,  email, st_obraz, sex, birth_date, cilj FROM users WHERE id = $1', [userId]);

        if(result.rows.length === 0){
            return res.status(404).json({message: 'Korisnik ne postoji'});
        }

        res.json(result.rows[0]);

    }catch(err){
        console.error('error while registering user', err);
        res.status(500).json({message: 'server je u kurcu'});
    }
});

router.post('/update', verifyToken, async (req, res) => {
    try{
        const userId = req.user.id;
        const {name, surname, email, cilj, st_obraz, birth_date, sex} = req.body;

        if(!name || !surname || !email){
            return res.status(400).json({message: 'obavezna polja: ime, prezime, email'});
        }

        await pool.query(
            'UPDATE users SET name = $1, surname = $2, email = $3, st_obraz = $4, cilj = $5, sex = $6, birth_date = $7 WHERE id = $8',
            [name, surname, email, st_obraz, cilj, sex, birth_date, userId]
        );
        res.json({message:'uspjesno azuiriranje profila'});

    }catch(err){
        console.error('error while updating user', err);
        res.status(500).json({message: 'server je u kurcu'});
    }
})

module.exports = router;

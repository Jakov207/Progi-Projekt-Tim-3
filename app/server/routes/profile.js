const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const resP = require("pg/lib/query");


router.get('/', verifyToken, async (req, res) => {
    try{

        const result = await pool.query('SELECT name, surname, email, is_professor FROM users WHERE id = $1', [req.user.id]);

        if(result.rows.length === 0){
            return res.status(404).json({message: 'Korisnik ne postoji'});
        }

        const user = result.rows[0];

        let profile = {};

        console.log(user.is_professor);

        if(user.is_professor){
             const resP = await pool.query(
                'SELECT sex, city, teaching FROM professors where professors.user_id = $1', [req.user.id]
             );
             console.log(resP);
            profile = resP.rows[0] ?? {};
        }
        else{
            const resS = await pool.query(
                'SELECT sex, city, education FROM students where students.user_id = $1', [req.user.id]
            );
            console.log(resS);
            profile = resS.rows[0] ?? {};
        }

        console.log(profile);
        return res.json({
            ...user,
            profile
        });

    }catch(err){
        console.error('error while registering user', err);
        res.status(500).json({message: 'server je u kurcu'});
    }
});

router.post('/update', verifyToken, async (req, res) => {
    try{
        const userId = req.user.id;
        const {name, surname, email, sex, city, education, teaching, is_professor, date_of_birth} = req.body;

        if(!name || !surname || !email || is_professor === null){
            return res.status(400).json({message: 'sva obavezna polja nisu ispunjena'});
        }

        await pool.query(
            'UPDATE users SET name = $1, surname = $2, email = $3, is_professor = $4 WHERE id = $5',
            [name, surname, email, is_professor, userId]
        );
        console.log('uspjesno azuiriranje pola profila');
        if(is_professor){
            await pool.query(
                'UPDATE professors SET sex = $1, city = $2, teaching = $3, date_of_birth = $4 WHERE user_id=$5',
                [sex, city, teaching, date_of_birth, userId]
            );
        }else {
            await pool.query(
                'UPDATE students SET sex = $1, city = $2, education = $3, date_of_birth = $4 WHERE user_id=$5',
                [sex, city, education, date_of_birth, userId]
            );
        }

        console.log('uspjesno azuriranje potpunog profila');
        console.log(req.body);

        res.json({message: 'sve stima'});


    }catch(err){
        console.error('error while updating user', err);
        res.status(500).json({message: 'server je u kurcu'});
    }
})

module.exports = router;

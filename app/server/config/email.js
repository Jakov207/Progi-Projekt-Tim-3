// config/email.js (za SendGrid SMTP)

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net', // Standardni SendGrid SMTP host
    port: 587,
    secure: false,
    auth: {
        user: 'apikey',
        pass: process.env.EMAIL_SERVICE_KEY, // Vaš API ključ
    },
});

// ... (ostatak sendEmail funkcije)
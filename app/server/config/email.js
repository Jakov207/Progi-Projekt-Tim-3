// config/email.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
        user: 'apikey',
        pass: process.env.EMAIL_SERVICE_KEY,
    },
});

// Implementacija funkcije koja koristi transporter
const sendEmail = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        // console.log("Message sent: %s", info.messageId); // Logiranje za debugging
        return true;
    } catch (error) {
        // console.error("Error sending email:", error); // Logirajte detaljnu grešku
        return false;
    }
};

// Direktan izvoz funkcije, kako je testconnections.js očekuje
module.exports = sendEmail;
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//cookie
app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 15 * 60 * 1000 // 15 min
    }
}))

const authRoutes = require('./routes/auth');
app.use("/auth", authRoutes);

//pali server na portu 8080
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
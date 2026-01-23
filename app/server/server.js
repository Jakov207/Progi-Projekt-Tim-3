const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // DODANO
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/auth');
app.use("/api/auth", authRoutes);

const profRoutes = require('./routes/profile');
app.use('/api/profile', profRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/finish-register", (req, res) => {
    res.sendFile(path.join(__dirname, "public/finish-register.html"));
});

app.use("/api/instructors", require("./routes/instructors"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/quizzes", require("./routes/quizzes"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
// src/App.jsx
import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import RegisterEmail from './pages/RegisterEmail'
import VerifyEmail from './pages/VerifyEmail'
import FinishRegister from './pages/FinishRegister'

function App() {
    return (
        <div>
            <nav>
                <Link to="/">Početna</Link> |
                <Link to="/login">Prijava</Link> |
                <Link to="/register">Registracija</Link>
            </nav>
            <hr />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterEmail />} />

                {/* Ova ruta hvata token iz email linka */}
                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                {/* Stranica za završetak registracije (Korak 2) */}
                <Route path="/finish-register" element={<FinishRegister />} />
            </Routes>
        </div>
    )
}

export default App
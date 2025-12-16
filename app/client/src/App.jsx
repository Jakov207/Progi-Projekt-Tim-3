import React from 'react';
import { Routes, Route } from 'react-router-dom';


import Home from './pages/Home';
import Login from './pages/Login';
import RegisterEmail from './pages/RegisterEmail';
import FinishRegister from './pages/FinishRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// ... ostale

// Uvezi layout
import MainLayout from './components/MainLayout';
import {Profile} from "./pages/Profile.jsx";



function App() {
    return (
        <Routes>

            {/* Rute koje NE koriste layout (full-screen) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterEmail />} />
            <Route path="/finish-register" element={<FinishRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rute koje KORISTE MainLayout (s navigacijom) */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                {/* ... stavi ovdje sve ostale rute koje trebaju header ... */}
            </Route>

        </Routes>
    );
}

export default App;
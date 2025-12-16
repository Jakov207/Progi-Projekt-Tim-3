import React from 'react';
import { Routes, Route } from 'react-router-dom';


import Home from './pages/Home';
import Login from './pages/Login';
import RegisterEmail from './pages/RegisterEmail';
import FinishRegister from './pages/FinishRegister';
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
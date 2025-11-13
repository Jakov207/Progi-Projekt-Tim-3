import React from 'react';
import { Routes, Route } from 'react-router-dom';


import Home from './pages/Home';
import Login from './pages/Login';
import RegisterEmail from './pages/RegisterEmail';
import FinishRegister from './pages/FinishRegister';
// ... ostale

// Uvezi layout
import MainLayout from './components/MainLayout';

function App() {
    return (
        <Routes>

            {/* Rute koje NE koriste layout (full-screen) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterEmail />} />

            {/* Rute koje KORISTE MainLayout (s navigacijom) */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                {/* ... stavi ovdje sve ostale rute koje trebaju header ... */}
            </Route>

        </Routes>
    );
}

export default App;
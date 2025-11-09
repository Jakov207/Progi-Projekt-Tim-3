// src/pages/Home.jsx
import React from 'react';
import api from '../api';

function Home() {
    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            // Osvježavamo stranicu da backend obriše kolačić
            window.location.reload();
        } catch (err) {
            console.error('Greška pri odjavi', err);
        }
    };

    return (
        <div>
            <h1>Dobrodošli na Fertutor</h1>
            <p>Ovo je vaša početna stranica.</p>
            <button onClick={handleLogout}>Odjava</button>
        </div>
    );
}

export default Home;
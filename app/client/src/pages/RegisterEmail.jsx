// src/pages/RegisterEmail.jsx
import React, { useState } from 'react';
import api from '../api'; // Naš Axios servis

function RegisterEmail() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            // Pozivamo backend rutu /api/auth/register/email
            const response = await api.post('/auth/register/email', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Došlo je do greške.');
        }
    };

    return (
        <div>
            <h2>Korak 1: Registracija</h2>
            <p>Unesite svoj email kako biste započeli proces registracije.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Vaš email"
                    required
                />
                <button type="submit">Pošalji link za potvrdu</button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default RegisterEmail;
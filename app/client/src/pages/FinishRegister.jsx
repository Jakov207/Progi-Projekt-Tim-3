// src/pages/FinishRegister.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function FinishRegister() {
    const [formData, setFormData] = useState({
        password: '',
        passwordCheck: '',
        name: '',
        surname: '',
        is_student: true, // Pretpostavljamo da je student
        termsAndConditions: false,
    });
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Dohvaćamo email koji smo spremili nakon verifikacije
    useEffect(() => {
        const regEmail = localStorage.getItem('registrationEmail');
        if (!regEmail) {
            setError('Sesija registracije nije pronađena. Molimo krenite ispočetka.');
            navigate('/register');
        } else {
            setEmail(regEmail);
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.passwordCheck) {
            setError('Lozinke se ne podudaraju.');
            return;
        }
        if (!formData.termsAndConditions) {
            setError('Morate prihvatiti uvjete korištenja.');
            return;
        }

        try {
            // Šaljemo sve podatke, UKLJUČUJUĆI email
            const response = await api.post('/auth/finish-register', {
                email: email,
                ...formData,
            });

            // Backend nas je prijavio (postavio kolačić)
            localStorage.removeItem('registrationEmail'); // Čistimo
            navigate('/'); // Idemo na početnu stranicu kao prijavljeni korisnik

        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri završetku registracije.');
        }
    };

    return (
        <div>
            <h2>Korak 2: Završite Registraciju</h2>
            <p>Potvrdili ste email: **{email}**</p>
            <form onSubmit={handleSubmit}>
                <input name="name" onChange={handleChange} placeholder="Ime" required />
                <input name="surname" onChange={handleChange} placeholder="Prezime" required />
                <input name="password" type="password" onChange={handleChange} placeholder="Lozinka" required />
                <input name="passwordCheck" type="password" onChange={handleChange} placeholder="Ponovi lozinku" required />

                <div>
                    <label>
                        <input name="is_student" type="checkbox" checked={formData.is_student} onChange={handleChange} />
                        Student sam
                    </label>
                </div>
                <div>
                    <label>
                        <input name="termsAndConditions" type="checkbox" checked={formData.termsAndConditions} onChange={handleChange} />
                        Prihvaćam uvjete korištenja
                    </label>
                </div>

                <button type="submit">Završi registraciju</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default FinishRegister;
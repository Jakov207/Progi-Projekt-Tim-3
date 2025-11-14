// src/pages/FinishRegister.jsx

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import styles from './FinishRegister.module.css'; // Koristi kopirani CSS

import slikaRegistracija from '../assets/images/slikaRegistracija.png';

function FinishRegister() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        date_of_birth: '',
        sex: 'M', // Default 'Muški'
        is_professor: false, // Default 'Student'
        city: '',
        education: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Čitamo token iz URL-a

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Posebno rukovanje za 'is_professor' radio gumbe
        if (name === "is_professor") {
            setFormData(prev => ({ ...prev, is_professor: value === 'true' }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError("Token za registraciju nije pronađen. Molimo krenite ispočetka.");
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/finish-register', {
                token: token,
                ...formData
            });

            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri završetku registracije.');
        } finally {
            setLoading(false);
        }
    };

    const registerInfoText = "Registrirajte se kako biste pristupili rezervacijama, instruktorima i personaliziranom učenju.";

    return (
        <AuthLayout
            infoText={registerInfoText}
            infoImage={slikaRegistracija}
        >
            <div className={styles.formContainer}>
                <h2>Osnovni osobni podaci</h2>
                <form onSubmit={handleSubmit}>

                    <Input
                        icon="👤"
                        name="name"
                        placeholder="Ime*"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        icon="👤"
                        name="surname"
                        placeholder="Prezime*"
                        value={formData.surname}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        icon="📅"
                        type="date"
                        name="date_of_birth"
                        placeholder="Datum rođenja" // Placeholder se možda neće vidjeti
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        required
                    />

                    {/* --- NOVI KOD ZA SPOL --- */}
                    <div className={styles.selectGroup}>
                        <label htmlFor="sex">Spol*</label>
                        <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
                            <option value="M">Muški</option>
                            <option value="F">Ženski</option>
                            <option value="X">Ostalo / Ne želim reći</option>
                        </select>
                    </div>

                    {/* --- NOVI KOD ZA TIP KORISNIKA --- */}
                    <div className={styles.radioGroup}>
                        <p>Tip Korisnika*</p>
                        <label>
                            <input
                                type="radio"
                                name="is_professor"
                                value="false" // Student (false)
                                checked={formData.is_professor === false}
                                onChange={handleChange}
                            />
                            Student
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="is_professor"
                                value="true" // Profesor (true)
                                checked={formData.is_professor === true}
                                onChange={handleChange}
                            />
                            Profesor
                        </label>
                    </div>

                    {/* Polja koja si imao u backendu ali ne na slici */}
                    <Input
                        icon="🏙️"
                        name="city"
                        placeholder="Grad*"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        icon="🎓"
                        name="education"
                        placeholder="Edukacija (npr. FER)*"
                        value={formData.education}
                        onChange={handleChange}
                        required
                    />

                    <p className={styles.obaveznoPolje}>Sa znakom * označena obavezna polja.</p>

                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                    >
                        {loading ? 'Spremanje...' : 'Završi registraciju'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}

export default FinishRegister;
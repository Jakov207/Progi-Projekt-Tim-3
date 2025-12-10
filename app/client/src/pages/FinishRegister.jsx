import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import styles from './FinishRegister.module.css';
import FinishRegisterImage from '../assets/images/FinishRegister.png';
import { UserIcon, CalendarIcon, ProfileAvatarIcon } from '../components/Icons';

function FinishRegister() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        date_of_birth: '',
        sex: '',
        city: '',
        education_level: '',
        school: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setError("Token nije pronađen. Pokrenite registraciju ponovno.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/finish-register', {
                token,
                ...formData,
                is_professor: false
            });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Pogreška pri spremanju.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Side — Image */}
            <div className={styles.leftSide} style={{ backgroundImage: `url(${FinishRegisterImage})` }} />

            {/* Right Side */}
            <div className={styles.rightSide}>
                <h1>Osnovni osobni podaci</h1>

                <div className={styles.formLayout}>
                    {/* Profile Image Circle */}
                    <div className={styles.profileSection}>
                        <div className={styles.profilePic}>
                            <ProfileAvatarIcon size={120} color="#7bb8d8" />
                        </div>
                        <p>Profilna slika</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div className={styles.formGroup}>
                            <UserIcon className={styles.icon} />
                            <input
                                type="text"
                                name="name"
                                placeholder="Ime*"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Surname */}
                        <div className={styles.formGroup}>
                            <UserIcon className={styles.icon} />
                            <input
                                type="text"
                                name="surname"
                                placeholder="Prezime*"
                                value={formData.surname}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Birthdate */}
                        <div className={styles.formGroup}>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                required
                            />
                            <CalendarIcon className={styles.icon} />
                        </div>

                        {/* Gender */}
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                name="sex"
                                placeholder="Spol"
                                value={formData.sex}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Locked Field: Učenik */}
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                value="Učenik"
                                readOnly
                                className={styles.lockedField}
                            />
                        </div>

                        <hr />

                        {/* City */}
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                name="city"
                                placeholder="Mjesto"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Education */}
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                name="education_level"
                                placeholder="Stupanj obrazovanja"
                                value={formData.education_level}
                                onChange={handleChange}
                            />
                        </div>

                        {/* School */}
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                name="school"
                                placeholder="Škola"
                                value={formData.school}
                                onChange={handleChange}
                            />
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button className={styles.submitBtn} type="submit" disabled={loading}>
                            {loading ? 'Spremanje...' : 'Nastavi'}
                        </button>

                        <p className={styles.note}>Sa znakom * označena obavezna polja.</p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default FinishRegister;


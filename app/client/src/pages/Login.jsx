// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Dodaj Link
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import styles from './Login.module.css';
import slikaProfesora from '../assets/images/slikaProfesora.png';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const loginInfoText = "Prijavite se i otključajte sljedeći korak u svom učenju personalizirano, fleksibilno i vođeno vašim tempom.";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {

            await api.post('/auth/login', {
                email,
                password,
                rememberMe // Backend će ovo primiti u req.body
            });
            navigate('/'); // Uspješna prijava
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri prijavi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            infoText={loginInfoText}
            infoImage={slikaProfesora}
        >
            <div className={styles.formContainer}>
                <h2>Prijava</h2>
                <form onSubmit={handleSubmit}>

                    <Input
                        icon="📧"
                        type="email"
                        placeholder="Email Adresa"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        icon="🔒"
                        type="password"
                        placeholder="Lozinka"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className={styles.formOptions}>
                        <div className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember">Zapamti prijavu</label>
                        </div>
                        <a href="#" className={styles.forgotPassword}>
                            Zaboravili ste lozinku?
                        </a>
                    </div>

                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                    >
                        {loading ? 'Prijava...' : 'Prijava'}
                    </button>

                    <button type="button" className={`${styles.btn} ${styles.btnGoogle}`}>
                        <i className="fab fa-google"></i>
                        Prijava sa Google računom
                    </button>

                </form>

                <div className={styles.signupLink}>
                    <p>Još nemate račun?</p>
                    <Link to="/register" className={`${styles.btn} ${styles.btnSecondary}`}>
                        Registracija
                    </Link>
                </div>

            </div>
        </AuthLayout>
    );
}

export default Login;
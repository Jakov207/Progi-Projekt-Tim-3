
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import styles from './RegisterEmail.module.css'; // Koristi kopirani CSS
import GoogleLoginButton from "../components/GoogleLoginButton";


import slikaRegistracija from '../assets/images/slikaRegistracija.png';

function RegisterEmail() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [termsAndConditions, setTermsAndConditions] = useState(false);
    const [loading, setLoading] = useState(false);

    // Poruke
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Tekst za lijevu stranu
    const registerInfoText = "Registrirajte se kako biste pristupili rezervacijama, instruktorima i personaliziranom učenju.";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Frontend validacija (backend radi isto, ali dobro je i ovdje)
        if (password !== passwordCheck) {
            setError("Lozinke se ne podudaraju.");
            return;
        }
        if (!termsAndConditions) {
            setError("Morate prihvatiti uvjete korištenja.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                passwordCheck,
                termsAndConditions
            });

            // Uspjeh! Prikazujemo poruku "Link poslan..."
            setMessage(response.data.message);

        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri registraciji.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            infoText={registerInfoText}
            infoImage={slikaRegistracija}
        >
            <div className={styles.formContainer}>
                <h2>Registracija</h2>

                {/* Ako je poruka uspješno poslana, sakrij formu */}
                {message ? (
                    <div className={styles.successMessage}>
                        <h3>Provjerite email!</h3>
                        <p>{message}</p>
                    </div>
                ) : (
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
                        <Input
                            icon="🔒"
                            type="password"
                            placeholder="Potvrdi Lozinku"
                            value={passwordCheck}
                            onChange={(e) => setPasswordCheck(e.target.value)}
                            required
                        />

                        {/* Ovdje može ići onaj dropdown "Minimalni zahtjevi",
                ali zasad ćemo ga preskočiti radi jednostavnosti */}

                        <div className={styles.termsCheckbox}>
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAndConditions}
                                onChange={(e) => setTermsAndConditions(e.target.checked)}
                            />
                            <label htmlFor="terms">Prihvaćam uvjete korištenja</label>
                        </div>

                        {error && <p className={styles.errorMessage}>{error}</p>}

                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            disabled={loading || !termsAndConditions}
                        >
                            {loading ? 'Slanje...' : 'Registracija'}
                        </button>

                        <div style={{ margin: "20px 0", textAlign: "center" }}>
                            <GoogleLoginButton />
                        </div>

                        <div className={styles.loginLink}>
                            <p>Već imate račun?</p>
                            <Link to="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
                                Prijava
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </AuthLayout>
    );
}

export default RegisterEmail;
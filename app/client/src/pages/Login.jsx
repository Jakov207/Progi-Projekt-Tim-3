import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import styles from './Login.module.css';
import slikaProfesora from '../assets/images/slikaProfesora.png';
import { AuthContext } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password, rememberLogin: rememberMe });
            setUser(res.data.user); // Spremi user u context
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri prijavi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout infoText="Prijavite se..." infoImage={slikaProfesora}>
            <div className={styles.formContainer}>
                <h2>Prijava</h2>
                <form onSubmit={handleSubmit}>
                    <Input icon="📧" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input icon="🔒" type="password" placeholder="Lozinka" value={password} onChange={e => setPassword(e.target.value)} required />
                    <div className={styles.formOptions}>
                        <div className={styles.rememberMe}>
                            <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                            <label htmlFor="remember">Zapamti prijavu</label>
                        </div>
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
                        {loading ? 'Prijava...' : 'Prijava'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}

export default Login;

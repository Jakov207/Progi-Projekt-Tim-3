// client/src/components/layout/Header.jsx
import React from 'react';
import styles from './Header.module.css'; // Uvozimo CSS Module

const Header = () => {
    return (
        <header className={styles.appHeader}>
            <div className={styles.logoContainer}>
                <a href="/">LOGO</a> {/* Kasnije zamijenite s pravim logom */}
            </div>
            <nav className={styles.mainNav}>
                <a href="/">Početna</a>
                <a href="/instruktori">Instruktori</a>
                <a href="/kvizovi">Kvizovi</a>
            </nav>
            <div className={styles.authButtons}>
                <a href="/registracija">Registracija</a>
                <button className={styles.loginButton}>Prijava</button>
            </div>
        </header>
    );
};

export default Header;
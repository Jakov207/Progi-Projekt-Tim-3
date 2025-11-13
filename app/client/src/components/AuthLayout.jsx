// src/components/AuthLayout.jsx

import React from 'react';
import styles from './AuthLayout.module.css';



function AuthLayout({ children, infoText, infoImage }) {
    return (
        <div className={styles.container}>

            {/* Lijeva strana (sada je dinamična) */}
            <div className={styles.infoPanel}>
                <div className={styles.infoContent}>
                    <p>{infoText}</p>
                </div>
                {/* Koristimo 'infoImage' prop */}
                <img
                    className={styles.infoImage}
                    src={infoImage} // Slika dolazi kao prop
                    alt="Ilustracija"
                />
            </div>

            {/* Desna strana (prima sadržaj - 'children') */}
            <div className={styles.formPanel}>
                {children}
            </div>

        </div>
    );
}

export default AuthLayout;
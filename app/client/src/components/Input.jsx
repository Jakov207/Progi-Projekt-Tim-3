// src/components/Input.jsx

import React from 'react';
import styles from './Input.module.css';

function Input({ icon, type, placeholder, value, onChange, required = false }) {
    return (
        <div className={styles.inputGroup}>
            {/* Prikazujemo ikonu (emoji) samo ako je poslana */}
            {icon && <span className={styles.inputIcon}>{icon}</span>}

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className={icon ? styles.withIcon : ''}
            />
        </div>
    );
}

export default Input;
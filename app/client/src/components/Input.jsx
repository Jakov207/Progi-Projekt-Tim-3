// src/components/Input.jsx

import React from 'react';
import styles from './Input.module.css';

// Koristimo 'rest' operator da uhvatimo sve ostale props (name, value, onChange, required)
function Input({ icon, type, placeholder, value, onChange, ...rest }) {
    return (
        <div className={styles.inputGroup}>
            {icon && <span className={styles.inputIcon}>{icon}</span>}

            <input
                // 1. Ovdje prosljeđujemo 'value' i 'onChange'
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}

                // 2. Prosljeđujemo sve ostale props (name, required, itd.)
                {...rest}

                className={icon ? styles.withIcon : ''}
            />
        </div>
    );
}

export default Input;
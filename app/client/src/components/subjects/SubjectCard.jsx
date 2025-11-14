// client/src/components/subjects/SubjectCard.jsx
import React from 'react';
import styles from './SubjectCard.module.css';

// Komponenta prima 'title' i 'description' kao props
const SubjectCard = ({ title, description }) => {
    return (
        <div className={styles.card}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
            <button className={styles.cardButton}>Pronađi</button>
        </div>
    );
};

export default SubjectCard;
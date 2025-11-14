// client/src/pages/Home.jsx
import React from 'react';
import styles from './Home.module.css'; // NAJVAŽNIJA LINIJA - uvozimo stilove
import SubjectCardsSection from '../components/subjects/SubjectCardsSection';

const Home = () => {
    return (
        // Koristimo React Fragment <> da grupiramo više elemenata
        <>
            <main className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <h1>Uči pametnije, postiži više – pronađi instruktora koji ti odgovara.</h1>
                        <div className={styles.searchBar}>
                            <input type="text" placeholder="Pretraži instruktora, predmet..." />
                            <button>Pretraži</button>
                        </div>
                    </div>
                    <div className={styles.heroImageContainer}>
                        <div className={styles.videoPlaceholderGraphic}></div>
                    </div>
                </div>
            </main>

            {/* OVDJE DODAJEMO NOVU SEKCIJU */}
            <SubjectCardsSection />
        </>
    );
};

export default Home;
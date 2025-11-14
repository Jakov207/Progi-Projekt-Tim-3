import React from "react";
import styles from "./Home.module.css";
import heroImage from "../assets/images/slikaProfesora.png"; // <-- SLIKA IZ ASSETS

const Home = () => {
    return (
        <main className={styles.heroSection}>
            <div className={styles.heroContent}>

                {/* Lijevi dio: tekst + search */}
                <div className={styles.leftSide}>
                    <h1>
                        Uči pametnije, postiži više — <br />
                        pronađi instruktora koji ti odgovara.
                    </h1>

                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Pretraži instruktora, predmet..."
                        />
                        <button>🔍</button>
                    </div>
                </div>

                {/* Desni dio: slika */}
                <div className={styles.rightSide}>
                    <img src={heroImage} alt="Instruktor" className={styles.heroImg} />
                </div>
            </div>
        </main>
    );
};

export default Home;
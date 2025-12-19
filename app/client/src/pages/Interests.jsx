import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Interests.module.css";
import finishRegisterImg from "../assets/images/FinishRegister.png";

function Interests() {
    const [selected, setSelected] = useState([]);
    const navigate = useNavigate();

    const toggleInterest = (value) => {
        setSelected((prev) =>
            prev.includes(value)
                ? prev.filter((i) => i !== value)
                : [...prev, value]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Odabrani interesi:", selected);

        // Za sada samo redirect
        navigate("/login");
    };

    return (
        <div className={styles.container}>
            {/* Lijeva strana */}
            <div
                className={styles.leftSide}
                style={{ backgroundImage: `url(${finishRegisterImg})` }}
            />

            {/* Desna strana */}
            <div className={styles.rightSide}>
                <h1>Osobni Interesi</h1>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.grid}>
                        <Interest
                            label="Matematika | Osnovna Škola"
                            icon="fa-square-root-variable"
                            value="mat_os"
                            checked={selected.includes("mat_os")}
                            onToggle={toggleInterest}
                        />
                        <Interest
                            label="Matematika | Srednja Škola"
                            icon="fa-square-root-variable"
                            value="mat_ss"
                            checked={selected.includes("mat_ss")}
                            onToggle={toggleInterest}
                        />
                        <Interest
                            label="Fizika | Osnovna Škola"
                            icon="fa-atom"
                            value="fiz_os"
                            checked={selected.includes("fiz_os")}
                            onToggle={toggleInterest}
                        />
                        <Interest
                            label="Fizika | Srednja Škola"
                            icon="fa-atom"
                            value="fiz_ss"
                            checked={selected.includes("fiz_ss")}
                            onToggle={toggleInterest}
                        />
                        <Interest
                            label="Informatika | Osnovna Škola"
                            icon="fa-computer"
                            value="inf_os"
                            checked={selected.includes("inf_os")}
                            onToggle={toggleInterest}
                        />
                        <Interest
                            label="Informatika | Srednja Škola"
                            icon="fa-computer"
                            value="inf_ss"
                            checked={selected.includes("inf_ss")}
                            onToggle={toggleInterest}
                        />
                    </div>

                    <div className={styles.buttons}>
                        <button
                            type="button"
                            className={styles.skipBtn}
                            onClick={() => navigate("/login")}
                        >
                            Preskoči
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            Završi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Interest({ label, icon, value, checked, onToggle }) {
    return (
        <label className={styles.card}>
            <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(value)}
            />
            <span>
                {label} <i className={`fa-solid ${icon}`} />
            </span>
        </label>
    );
}

export default Interests;

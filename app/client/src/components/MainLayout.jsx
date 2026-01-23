// src/components/MainLayout.jsx
import React, { useContext } from "react";
import { Link, Outlet } from "react-router-dom"; // <--- Outlet je ključan
import styles from "./MainLayout.module.css";
import logo from "../assets/images/logo.png";
import { getImageUrl } from "../api";
import { AuthContext } from "../context/AuthContext";

function MainLayout() {
    const { user, logout } = useContext(AuthContext);

    return (
        <>
            <header className={styles.navbar}>
                <Link to="/" className={styles.logoWrapper}>
                    <img src={logo} alt="Logo" className={styles.logo} />
                </Link>

                <nav className={styles.navLinks}>
                    <Link to="/">Početna</Link>

                    {/* Only show for NON-professors */}
                    {user && !user.is_professor && (
                        <>
                            <Link to="/instructors">Instruktori</Link>
                        </>
                    )}

                    {/* Optional: show for guests (not logged in) */}
                    {!user && (
                        <>
                            <Link to="/instructors">Instruktori</Link>
                        </>
                    )}

                    <Link to="/quizzes">Kvizovi</Link>

                    {user && (
                        <Link to="/calendar">
                            {user.is_professor ? "Moj kalendar" : "Moji termini"}
                        </Link>
                    )}
                    {user && <Link to="/profile">Profil</Link>}
                </nav>


                <div className={styles.rightSide}>
                    {!user ? (
                        <>
                            <Link to="/register" className={styles.registerBtn}>Registracija</Link>
                            <Link to="/login" className={styles.loginBtn}>Prijava</Link>
                        </>
                    ) : (
                        <>
                            <span className={styles.userName}>
                                {user.name}
                            </span>
                            <span className={styles.separator}>
                                |
                            </span>
                            <div className={styles.userInfo}>
                                <div className={styles.avatarWrapper}>
                                    {user.profile_picture ? (
                                        <img
                                            src={getImageUrl(user.profile_picture)}
                                            alt="Profil"
                                            className={styles.avatar}
                                        />
                                    ) : (
                                        <i className="fa-solid fa-user"></i>
                                    )}
                                </div>
                            </div>

                            <button onClick={logout} className={styles.loginBtn}>
                                Odjava
                            </button>
                        </>
                    )}
                </div>

            </header>

            {/* GLAVNI SADRŽAJ STRANICE */}
            <main className={styles.pageContent}>
                <Outlet /> {/* <-- React Router ovdje ubacuje Home, Profile itd */}
            </main>
        </>
    );
}

export default MainLayout;

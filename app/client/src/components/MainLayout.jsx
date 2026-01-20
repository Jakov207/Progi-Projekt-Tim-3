// src/components/MainLayout.jsx
import React, { useContext, useMemo } from "react";
import { Link, Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";
import logo from "../assets/images/logo.png";
import { getImageUrl } from "../api";
import { AuthContext } from "../context/AuthContext";

function MainLayout() {
    const { user, logout } = useContext(AuthContext);

    const initials = useMemo(() => {
        if (!user) return "";
        const first = (user.name || "").trim().charAt(0);
        const last = (user.surname || "").trim().charAt(0);
        return `${first}${last}`.toUpperCase() || "U";
    }, [user]);

    return (
        <>
            <header className={styles.navbar}>
                <Link to="/" className={styles.logoWrapper}>
                    <img src={logo} alt="Logo" className={styles.logo} />
                </Link>

                <nav className={styles.navLinks}>
                    <Link to="/">Početna</Link>

                    {user && !user.is_professor && (
                        <>
                            <Link to="/instructors">Instruktori</Link>
                            <Link to="/quizzes">Kvizovi</Link>
                        </>
                    )}

                    {!user && (
                        <>
                            <Link to="/instructors">Instruktori</Link>
                            <Link to="/quizzes">Kvizovi</Link>
                        </>
                    )}

                    {user && <Link to="/profile">Profil</Link>}

                    {user && (
                        <Link to="/calendar">
                            {user.is_professor ? "Moj kalendar" : "Moji termini"}
                        </Link>
                    )}
                </nav>

                <div className={styles.rightSide}>
                    {!user ? (
                        <>
                            <Link to="/register" className={styles.registerBtn}>Registracija</Link>
                            <Link to="/login" className={styles.loginBtn}>Prijava</Link>
                        </>
                    ) : (
                        <>
                            <span className={styles.userName}>{user.name}</span>
                            <span className={styles.separator}>|</span>

                            <div className={styles.userInfo}>
                                <div className={styles.avatarWrapper}>
                                    {user.profile_picture ? (
                                        <img
                                            src={getImageUrl(user.profile_picture)}
                                            alt="Profil"
                                            className={styles.avatar}
                                        />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {initials}
                                        </div>
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

            <main className={styles.pageContent}>
                <Outlet />
            </main>
        </>
    );
}

export default MainLayout;

import React from "react";
import { Link, Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";
import logo from "../assets/images/logo.png";

function MainLayout() {
    return (
        <>
            <header className={styles.navbar}>

                {/* LOGO */}
                <Link to="/" className={styles.logoWrapper}>
                    <img src={logo} alt="Logo" className={styles.logo} />
                </Link>

                {/* NAV LINKS */}
                <nav className={styles.navLinks}>
                    <Link to="/">Početna</Link>
                    <Link to="/instructors">Instruktori</Link>
                    <Link to="/quizzes">Kvizovi</Link>
                    <Link to="/profile">Profil</Link>
                </nav>

                {/* RIGHT SIDE BUTTONS */}
                <div className={styles.rightSide}>
                    <Link to="/register" className={styles.registerBtn}>Registracija</Link>
                    <Link to="/login" className={styles.loginBtn}>Prijava</Link>
                </div>
            </header>

            {/* CONTENT */}
            <main className={styles.pageContent}>
                <Outlet />
            </main>
        </>
    );
}

export default MainLayout;
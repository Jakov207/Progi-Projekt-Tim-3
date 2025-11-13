// src/components/MainLayout.jsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function MainLayout() {
    return (
        <div>
            <nav>
                <Link to="/">Početna</Link> |
                <Link to="/login">Prijava</Link> |
                <Link to="/register">Registracija</Link>
            </nav>
            <hr />

            {/* <Outlet /> je mjesto gdje će se učitati Home, itd. */}
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;
// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Uvozimo našu novu Header komponentu

function MainLayout() {
    return (
        // Umjesto običnog <div>, možemo koristiti React.Fragment <>
        // da ne dodajemo nepotrebne elemente u DOM.
        <>
            <Header /> {/* Naš novi, stilizirani header */}

            {/* <Outlet /> je mjesto gdje će se učitati Home, Login, itd. */}
            <main>
                <Outlet />
            </main>
        </>
    );
}

export default MainLayout;
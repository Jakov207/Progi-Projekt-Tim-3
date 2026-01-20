// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Dohvati trenutno prijavljenog usera
    const refreshUser = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    // 🔥 NOVO: helper za ručno ažuriranje usera (npr. nakon upload-a slike)
    const updateUser = (partialUser) => {
        setUser(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                ...partialUser
            };
        });
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            setUser(null);
            navigate("/");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                updateUser,   // 👈 bitno
                refreshUser,
                logout,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

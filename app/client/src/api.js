// src/api.js
import axios from 'axios';

// Kreiramo instancu Axios-a
// Svi pozivi sada automatski koriste Vite proxy (jer počinju s /api)
const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Važno za slanje/primanje kolačića (cookies)
});

export default api;
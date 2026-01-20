import { useEffect, useState } from "react";
import axios from "../api";
import { getImageUrl } from "../api";
import { useNavigate } from "react-router-dom";
import styles from "./Instructors.module.css";

export default function Instructors() {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        teaching_type: "",
        max_price: "",
        interests: []
    });

    const interestsList = [
        "📐 Matematika Osnovna Škola",
        "🔬 Fizika Osnovna Škola",
        "💻 Informatika Osnovna Škola",
        "📐 Matematika Srednja Škola",
        "🔬 Fizika Srednja Škola",
        "💻 Informatika Srednja Škola"
    ];

    useEffect(() => {
        fetchInstructors();
    }, [filters]);

    const fetchInstructors = async () => {
        const params = {
            ...filters,
            interests: filters.interests.join(",")
        };
        const res = await axios.get("/instructors", { params });
        setInstructors(res.data);
    };

    const toggleInterest = (value) => {
        const cleanValue = value.replace(/^[^\s]+\s/, ""); // makne emoji

        setFilters(f => ({
            ...f,
            interests: f.interests.includes(cleanValue)
                ? f.interests.filter(i => i !== cleanValue)
                : [...f.interests, cleanValue]
        }));
    };

    return (
        <div className={styles.page}>
            <h1>Instruktori</h1>

            <div className={styles.filters}>
                <div className={styles.filtersRow}>
                <input
                    placeholder="🔎 Pretraži ime..."
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />

                <select
                    value={filters.teaching_type}
                    onChange={e => setFilters(f => ({ ...f, teaching_type: e.target.value }))}
                >
                    <option value="">🎓 Način predavanja</option>
                    <option value="Uživo">🏫 Uživo</option>
                    <option value="Online">💻 Online</option>
                    <option value="Uživo i Online">🏫💻 Uživo i Online</option>
                </select>

                <input
                    type="number"
                    placeholder="💰 Max cijena (€)"
                    value={filters.max_price}
                    onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))}
                />
                </div>
                <div className={styles.interests}>
                    {interestsList.map(i => {
                        const clean = i.replace(/^[^\s]+\s/, "");
                        return (
                            <label key={i}>
                                <input
                                    type="checkbox"
                                    checked={filters.interests.includes(clean)}
                                    onChange={() => toggleInterest(i)}
                                />
                                {i}
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className={styles.grid}>
                {instructors.map(i => (
                    <div key={i.id} className={styles.card} onClick={() => navigate(`/instructors/${i.id}`)}>
                        <img
                            src={i.profile_picture ? getImageUrl(i.profile_picture) : "/avatar.png"}
                            alt=""
                        />
                        <h3>{i.name} {i.surname}</h3>
                        <p>{i.teaching_type}</p>
                        {i.min_price != null ? (
                            <p>{i.min_price} € / sat</p>
                        ) : (
                            <p className={styles.noPrice}>Nema slobodnih termina</p>
                        )}
                        <p>{i.city}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

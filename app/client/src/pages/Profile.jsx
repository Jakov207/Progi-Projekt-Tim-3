import { useEffect, useState } from "react";
import axios from "../api"; // <-- koristi axios instance sa tokenom
import styles from "./Profile.module.css";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("personal");

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        sex: "",
        city: "",
        education: "",
        teaching: "",
        date_of_birth: "",
        is_professor: false,
    });

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const res = await axios.get("/profile");
            const u = res.data;

            setForm({
                name: u.name,
                surname: u.surname,
                email: u.email,
                sex: u.profile.sex ?? "",
                city: u.profile.city ?? "",
                education: u.profile.education ?? "",
                teaching: u.profile.teaching ?? "",
                date_of_birth: u.profile.date_of_birth?.split("T")[0] ?? "",
                is_professor: u.is_professor
            });

        } catch (err) {
            setError("Greška pri učitavanju profila.");
        } finally {
            setLoading(false);
        }
    }

    async function saveChanges() {
        setError("");
        setMessage("");

        if (!form.name || !form.surname || !form.date_of_birth) {
            setError("Polja Ime, Prezime i Datum rođenja su obavezna.");
            return;
        }

        try {
            await axios.post("/profile/update", form);
            setMessage("Promjene su uspješno spremljene.");
        } catch (e) {
            setError("Greška pri spremanju.");
        }
    }

    function updateField(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Učitavanje...</p>;

    return (
        <div className={styles['profile-page']}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles['sidebar-user']}>
                    <div className={styles['sidebar-avatar']}><i className="fa-solid fa-user"></i></div>
                    <div>
                        <div className={styles['sidebar-name']}>{form.name} {form.surname}</div>
                        <div className={styles['sidebar-role']}>{form.is_professor ? "Profesor" : "Učenik"}</div>
                    </div>
                </div>

                <button className={`${styles['nav-btn']} ${activeTab === "personal" ? styles.active : ""}`} onClick={() => setActiveTab("personal")}>Osobni podaci</button>
                <button className={styles['nav-btn']} onClick={() => setActiveTab("blank")}>Predmeti</button>
                <button className={styles['nav-btn']} onClick={() => setActiveTab("blank")}>Notifikacije</button>
                <button className={styles['nav-btn']} onClick={() => setActiveTab("blank")}>Brisanje računa</button>
            </aside>


            {/* Content */}
            <section className={styles.content}>
                {activeTab === "personal" ? (
                    <>
                        <h2>Tvoji osobni podaci</h2>

                        <div className={styles['form-section']}>

                            <div className={styles['form-fields']}>
                                <label>Ime</label>
                                <input value={form.name} onChange={e => updateField("name", e.target.value)} />

                                <label>Prezime</label>
                                <input value={form.surname} onChange={e => updateField("surname", e.target.value)} />

                                <label>Email</label>
                                <input value={form.email} onChange={e => updateField("email", e.target.value)} />

                                <label>Datum rođenja</label>
                                <input type="date" value={form.date_of_birth} onChange={e => updateField("date_of_birth", e.target.value)} />

                                <label>Grad</label>
                                <input value={form.city} onChange={e => updateField("city", e.target.value)} />

                                {form.is_professor ? (
                                    <>
                                        <label>Predmet</label>
                                        <input value={form.teaching} onChange={e => updateField("teaching", e.target.value)} />
                                    </>
                                ) : (
                                    <>
                                        <label>Obrazovanje</label>
                                        <input value={form.education} onChange={e => updateField("education", e.target.value)} />
                                    </>
                                )}
                            </div>

                            {/* Profile photo */}
                            <div className={styles['profile-photo']}>
                                <div className={styles['circle-photo']}><i className="fa-solid fa-user"></i></div>
                                <button className={styles['edit-photo']}>Uredi</button>
                            </div>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}
                        {message && <p className={styles.success}>{message}</p>}

                        <button className={styles['save-btn']} onClick={saveChanges}>💾 Spremi promjene</button>
                    </>
                ) : (
                    <p style={{ opacity: 0.6 }}>⚙️ Ova sekcija još nije implementirana.</p>
                )}
            </section>
        </div>
    );
}
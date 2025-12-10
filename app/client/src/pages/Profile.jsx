import { useEffect, useState } from "react";
import axios from "../api";
import styles from "./Profile.module.css";

export default function Profile() {
    const [activeTab, setActiveTab] = useState("osobni");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        name: "",
        surname: "",
        date_of_birth: "",
        sex: "",
        city: "",
        school: "",
        teaching: "",
        is_professor: false
    });

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
                date_of_birth: u.profile.date_of_birth?.split("T")[0] ?? "",
                sex: u.profile.sex ?? "",
                city: u.profile.city ?? "",
                school: u.profile.school ?? "",
                teaching: u.profile.teaching ?? "",
                is_professor: u.is_professor
            });

        } catch (err) {
            setError("Greška pri učitavanju profila.");
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, val) {
        setForm(prev => ({ ...prev, [key]: val }));
    }

    async function saveChanges(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!form.name || !form.surname || !form.date_of_birth) {
            setError("Molimo ispunite polja Ime, Prezime i Datum rođenja.");
            return;
        }

        try {
            await axios.post("/profile/update", form);
            setMessage("Promjene su uspješno spremljene!");
        } catch (err) {
            setError("Greška pri spremanju.");
        }
    }

    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Učitavanje…</p>;

    return (
        <div className={styles.pageWrapper}>
            <main className={styles.mainContainer}>

                {/* SIDEBAR */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarUser}>
                        <div className={styles.sidebarAvatar}>
                            <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <div className={styles.sidebarName}>{form.name} {form.surname}</div>
                            <div className={styles.sidebarRole}>{form.is_professor ? "Profesor" : "Učenik"}</div>
                        </div>
                    </div>

                    <nav className={styles.settingsNav}>
                        <button
                            className={`${styles.navBtn} ${activeTab === "osobni" ? styles.active : ""}`}
                            onClick={() => setActiveTab("osobni")}
                        >
                            Osobni podaci
                        </button>

                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Predmeti</button>
                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Personalizacija</button>
                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Notifikacije</button>

                        <hr />

                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Sigurnost</button>
                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Privatnost</button>
                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Povijest aktivnosti</button>

                        <hr />

                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Podrška</button>
                        <button className={styles.navBtn} onClick={() => setActiveTab("blank")}>Brisanje računa</button>

                        <hr />

                        <button className={styles.navBtn} onClick={() => {}}>Odjava</button>
                    </nav>
                </aside>

                {/* CONTENT */}
                <section className={styles.content}>
                    {activeTab === "osobni" ? (
                        <div className={styles.pageActive}>
                            <h2>Tvoji osobni podaci</h2>

                            <form className={styles.editForm} onSubmit={saveChanges}>
                                {/* FORMA ZA UNOS JE PRVA (LIJEVA STRANA) */}
                                <div className={styles.formFields}>
                                    <label>Ime</label>
                                    <input value={form.name} onChange={e => updateField("name", e.target.value)} />

                                    <label>Prezime</label>
                                    <input value={form.surname} onChange={e => updateField("surname", e.target.value)} />

                                    <label>Datum rođenja</label>
                                    <input type="date" value={form.date_of_birth} onChange={e => updateField("date_of_birth", e.target.value)} />

                                    <label>Spol</label>
                                    <input value={form.sex} onChange={e => updateField("sex", e.target.value)} />

                                    <label>Mjesto/Grad</label>
                                    <input value={form.city} onChange={e => updateField("city", e.target.value)} />

                                    <label>Škola</label>
                                    <input value={form.school} onChange={e => updateField("school", e.target.value)} />

                                    {form.is_professor && (
                                        <>
                                            <label>Predmet</label>
                                            <input value={form.teaching} onChange={e => updateField("teaching", e.target.value)} />
                                        </>
                                    )}

                                    <button type="submit" className={styles.saveBtn}>💾 Spremi promjene</button>
                                </div>

                                {/* PROFILNA JE DRUGA (DESNA STRANA) */}
                                <div className={styles.photoSection}>
                                    <div className={styles.profileCircle}>
                                        <i className="fa-solid fa-user"></i>
                                    </div>
                                    <button className={styles.editPhotoBtn} type="button">
                                        <i className="fa-solid fa-pen"></i> Uredi
                                    </button>
                                </div>
                            </form>

                            {error && <p className={styles.error}>{error}</p>}
                            {message && <p className={styles.success}>{message}</p>}
                        </div>
                    ) : (
                        <div className={styles.pageBlank}>
                            <p style={{ opacity: 0.6 }}>⚙️ Ova sekcija još nije implementirana.</p>
                        </div>
                    )}
                </section>
            </main>s
        </div>
    );
}
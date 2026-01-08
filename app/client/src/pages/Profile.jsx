import { useEffect, useState } from "react";
import axios from "../api";
import ProfileImageModal from "../components/ProfileImageModal";
import { getImageUrl } from "../api";
import styles from "./Profile.module.css";

export function Profile() {
    const [activeTab, setActiveTab] = useState("osobni");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [interests, setInterests] = useState([]);

    const interestMap = {
        mat_os: "Matematika Osnovna Škola",
        fiz_os: "Fizika Osnovna Škola",
        inf_os: "Informatika Osnovna Škola",
        mat_ss: "Matematika Srednja Škola",
        fiz_ss: "Fizika Srednja Škola",
        inf_ss: "Informatika Srednja Škola"
    };

    const reverseInterestMap = Object.fromEntries(
        Object.entries(interestMap).map(([k, v]) => [v, k])
    );

    useEffect(() => {
        if (activeTab === "interesi") {
            axios.get("/profile/interests")
                .then(res => {
                    setInterests(res.data.map(i => reverseInterestMap[i]));
                })
                .catch(() => setInterests([]));
        }
    }, [activeTab]);

    const toggleInterest = (value) => {
        setInterests(prev =>
            prev.includes(value)
                ? prev.filter(i => i !== value)
                : [...prev, value]
        );
    };

    const saveInterests = async () => {
        setError("");
        setMessage("");

        try {
            await axios.post("/profile/interests", {
                interests: interests.map(i => interestMap[i])
            });
            setMessage("Interesi uspješno spremljeni!");
        } catch {
            setError("Greška kod spremanja interesa");
        }
    };

    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        date_of_birth: "",
        sex: "",
        city: "",
        education: "",
        teaching: "",
        is_professor: false,
        profile_picture: null
    });

    useEffect(() => {
        loadProfile();
    }, []);

    function formatDateForInput(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function loadProfile() {
        try {
            const res = await axios.get("/profile");
            const { name, surname, email, is_professor, profile_picture, profile } = res.data;
            setForm({
                name,
                surname,
                email,
                is_professor,
                profile_picture,
                date_of_birth: formatDateForInput(profile.date_of_birth), // ✅ FIX
                sex: profile.sex || "",
                city: profile.city || "",
                education: profile.education || "",
                teaching: profile.teaching || ""
            });
        } catch (err) {
            setError(err.response?.data?.message || "Greška kod dohvata podataka");
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, val) {
        setForm(prev => ({...prev, [key]: val}));
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
            await axios.post("/profile/update", {
                name: form.name,
                surname: form.surname,
                email: form.email,
                is_professor: form.is_professor,
                date_of_birth: form.date_of_birth,
                sex: form.sex,
                city: form.city,
                education: form.education,
                teaching: form.teaching
            });
            setMessage("Promjene uspješno spremljene!");
        } catch (err) {
            setError(err.response?.data?.message || "Greška kod spremanja");
        }
    }

    const handleImageUpdated = (newFilename) => {
        setForm(prev => ({ ...prev, profile_picture: newFilename }));
    };

    if (loading) return <p style={{textAlign: "center", marginTop: 40}}>Učitavanje…</p>;

    return (
        <div className={styles.pageWrapper}>
            <main className={styles.mainContainer}>

                <aside className={styles.sidebar}>
                    <button className={activeTab === "osobni" ? styles.active : ""} onClick={() => setActiveTab("osobni")}>
                        👤 Osobni podaci
                    </button>
                    <button className={activeTab === "sigurnost" ? styles.active : ""} onClick={() => setActiveTab("sigurnost")}>
                        🔒 Sigurnost
                    </button>
                    <button className={activeTab === "privatnost" ? styles.active : ""} onClick={() => setActiveTab("privatnost")}>
                        🛡️ Privatnost
                    </button>
                    <button
                        className={activeTab === "interesi" ? styles.active : ""}
                        onClick={() => setActiveTab("interesi")}
                    >
                        ⭐ Osobni interesi
                    </button>
                </aside>

                <section className={styles.content}>
                    {activeTab === "osobni" && (
                        <div className={styles.pageActive}>
                            <h2>Tvoji osobni podaci</h2>

                            <div className={styles.role}>
                                {form.is_professor ? "Instruktor" : "Student"}
                            </div>

                            <form className={styles.editForm} onSubmit={saveChanges}>
                                <div className={styles.formFields}>
                                    <label>Ime</label>
                                    <input value={form.name} onChange={e => updateField("name", e.target.value)}/>

                                    <label>Prezime</label>
                                    <input value={form.surname} onChange={e => updateField("surname", e.target.value)}/>

                                    <label>Datum rođenja</label>
                                    <input type="date" value={form.date_of_birth}
                                           onChange={e => updateField("date_of_birth", e.target.value)}/>

                                    <label>Spol</label>
                                    <select
                                        value={form.sex}
                                        onChange={e => updateField("sex", e.target.value)}
                                    >
                                        <option value="M">Muško</option>
                                        <option value="F">Žensko</option>
                                        <option value="X">Ostalo / Ne želim reći</option>
                                    </select>


                                    <label>Mjesto/Grad</label>
                                    <input value={form.city} onChange={e => updateField("city", e.target.value)}/>



                                    {!form.is_professor && (
                                        <>
                                            <label>Škola / Fakultet</label>
                                            <input value={form.education}
                                                   onChange={e => updateField("education", e.target.value)}/>
                                        </>
                                    )}

                                    {form.is_professor && (
                                        <>
                                            <label>Edukacija / Stručna sprema</label>
                                            <input value={form.teaching}
                                                   onChange={e => updateField("teaching", e.target.value)}/>
                                        </>
                                    )}

                                    <button type="submit" className={styles.saveBtn}>💾 Spremi promjene</button>
                                </div>

                                <div className={styles.photoSection}>
                                    <div className={styles.profileCircle}>
                                        {form.profile_picture ? (
                                            <img src={getImageUrl(form.profile_picture)} alt="Profil" />
                                        ) : (
                                            <i className="fa-solid fa-user"></i>
                                        )}
                                    </div>
                                    <button
                                        className={styles.editPhotoBtn}
                                        type="button"
                                        onClick={() => setIsImageModalOpen(true)}
                                    >
                                        <i className="fa-solid fa-pen"></i> Uredi
                                    </button>
                                </div>
                            </form>

                            {error && <p className={styles.error}>{error}</p>}
                            {message && <p className={styles.success}>{message}</p>}
                        </div>
                    )}

                    {activeTab === "interesi" && (
                        <div className={styles.pageActive}>
                            <h2>Osobni interesi</h2>

                            <div className={styles.interestsGrid}>
                                {Object.entries(interestMap).map(([key, label]) => (
                                    <label key={key} className={styles.interestCard}>
                                        <input
                                            type="checkbox"
                                            checked={interests.includes(key)}
                                            onChange={() => toggleInterest(key)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>

                            <button
                                className={styles.saveBtn}
                                onClick={saveInterests}
                            >
                                💾 Spremi interese
                            </button>
                            {error && <p className={styles.error}>{error}</p>}
                            {message && <p className={styles.success}>{message}</p>}
                        </div>
                    )}

                    {activeTab === "sigurnost" && (
                        <div className={styles.pageBlank}>
                            <p style={{opacity: 0.6}}>⚙️ Ova sekcija još nije implementirana.</p>
                        </div>
                    )}

                    {activeTab === "privatnost" && (
                        <div className={styles.pageBlank}>
                            <p style={{opacity: 0.6}}>⚙️ Ova sekcija još nije implementirana.</p>
                        </div>
                    )}
                </section>
            </main>

            <ProfileImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                currentImage={form.profile_picture ? getImageUrl(form.profile_picture) : null}
                onImageUpdated={handleImageUpdated}
            />
        </div>
    );
}
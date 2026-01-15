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
    const [saving, setSaving] = useState(false);

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

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 4000);
    };

    const saveInterests = async () => {
        setError("");
        setSaving(true);

        try {
            await axios.post("/profile/interests", {
                interests: interests.map(i => interestMap[i])
            });
            showMessage("Interesi uspješno spremljeni! ✓");
        } catch {
            setError("Greška kod spremanja interesa");
        } finally {
            setSaving(false);
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

    const [publicProfile, setPublicProfile] = useState({
        biography: "",
        video_url: "",
        reference: "",
        teaching_type: "",
        price: "",
        location: ""
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
                date_of_birth: formatDateForInput(profile.date_of_birth),
                sex: profile.sex || "",
                city: profile.city || "",
                education: profile.education || "",
                teaching: profile.teaching || ""
            });
            if (res.data.is_professor) {
                setPublicProfile({
                    biography: profile.biography || "",
                    video_url: profile.video_url || "",
                    reference: profile.reference || "",
                    teaching_type: profile.teaching_type || "",
                    price: profile.price || "",
                    location: profile.location || ""
                });
            }

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
        setSaving(true);

        if (!form.name || !form.surname || !form.date_of_birth) {
            setError("Molimo ispunite polja Ime, Prezime i Datum rođenja.");
            setSaving(false);
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
            showMessage("Promjene uspješno spremljene! ✓");
        } catch (err) {
            setError(err.response?.data?.message || "Greška kod spremanja");
        } finally {
            setSaving(false);
        }
    }

    const savePublicProfile = async () => {
        setError("");
        setSaving(true);

        try {
            await axios.post("/profile/public", publicProfile);
            showMessage("Javni profil spremljen! ✓");
        } catch {
            setError("Greška kod spremanja javnog profila");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpdated = (newFilename) => {
        setForm(prev => ({ ...prev, profile_picture: newFilename }));
        showMessage("Slika profila ažurirana! ✓");
    };

    const tabs = [
        { id: "osobni", icon: "👤", label: "Osobni podaci", desc: "Osnovne informacije" },
        { id: "interesi", icon: "⭐", label: "Interesi", desc: "Područja učenja" },
        ...(form.is_professor ? [{ id: "javni", icon: "🌍", label: "Javni profil", desc: "Vidljivo drugima" }] : []),
        { id: "sigurnost", icon: "🔒", label: "Sigurnost", desc: "Lozinka i pristup" },
        { id: "privatnost", icon: "🛡️", label: "Privatnost", desc: "Postavke privatnosti" }
    ];

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner}></div>
                <p>Učitavanje profila...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Success Banner */}
            {message && (
                <div className={styles.successBanner}>
                    {message}
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className={styles.errorBanner}>
                    ⚠️ {error}
                    <button onClick={() => setError("")} className={styles.dismissBtn}>×</button>
                </div>
            )}

            <div className={styles.container}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.avatarLarge} onClick={() => setIsImageModalOpen(true)}>
                            {form.profile_picture ? (
                                <img src={getImageUrl(form.profile_picture)} alt="Profil" />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <span>{form.name?.[0]}{form.surname?.[0]}</span>
                                </div>
                            )}
                            <div className={styles.avatarOverlay}>
                                <span>📷</span>
                            </div>
                        </div>
                        <h2>{form.name} {form.surname}</h2>
                        <span className={styles.roleBadge}>
                            {form.is_professor ? "👨‍🏫 Instruktor" : "🎓 Student"}
                        </span>
                    </div>

                    <nav className={styles.tabNav}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className={styles.tabIcon}>{tab.icon}</span>
                                <div className={styles.tabText}>
                                    <span className={styles.tabLabel}>{tab.label}</span>
                                    <span className={styles.tabDesc}>{tab.desc}</span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <main className={styles.content}>
                    {/* Osobni podaci */}
                    {activeTab === "osobni" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h1>👤 Osobni podaci</h1>
                                <p>Upravljajte svojim osnovnim informacijama</p>
                            </div>

                            <form className={styles.form} onSubmit={saveChanges}>
                                <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label>Ime</label>
                                        <input 
                                            value={form.name} 
                                            onChange={e => updateField("name", e.target.value)}
                                            placeholder="Vaše ime"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>Prezime</label>
                                        <input 
                                            value={form.surname} 
                                            onChange={e => updateField("surname", e.target.value)}
                                            placeholder="Vaše prezime"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>📅 Datum rođenja</label>
                                        <input 
                                            type="date" 
                                            value={form.date_of_birth}
                                            onChange={e => updateField("date_of_birth", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label>⚧ Spol</label>
                                        <select
                                            value={form.sex}
                                            onChange={e => updateField("sex", e.target.value)}
                                        >
                                            <option value="">Odaberi</option>
                                            <option value="M">Muško</option>
                                            <option value="F">Žensko</option>
                                            <option value="X">Ostalo / Ne želim reći</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label>📍 Mjesto / Grad</label>
                                        <input 
                                            value={form.city} 
                                            onChange={e => updateField("city", e.target.value)}
                                            placeholder="npr. Zagreb"
                                        />
                                    </div>

                                    {!form.is_professor && (
                                        <div className={styles.field}>
                                            <label>🏫 Škola / Fakultet</label>
                                            <input 
                                                value={form.education}
                                                onChange={e => updateField("education", e.target.value)}
                                                placeholder="Naziv obrazovne ustanove"
                                            />
                                        </div>
                                    )}

                                    {form.is_professor && (
                                        <div className={styles.field}>
                                            <label>🎓 Edukacija / Stručna sprema</label>
                                            <input 
                                                value={form.teaching}
                                                onChange={e => updateField("teaching", e.target.value)}
                                                placeholder="npr. Magistar matematike"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    {saving ? (
                                        <><span className={styles.btnSpinner}></span> Spremanje...</>
                                    ) : (
                                        "💾 Spremi promjene"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Interesi */}
                    {activeTab === "interesi" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h1>⭐ Osobni interesi</h1>
                                <p>Odaberite predmete koji vas zanimaju</p>
                            </div>

                            <div className={styles.interestsGrid}>
                                {Object.entries(interestMap).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`${styles.interestCard} ${interests.includes(key) ? styles.interestActive : ""}`}
                                        onClick={() => toggleInterest(key)}
                                    >
                                        <span className={styles.interestCheck}>
                                            {interests.includes(key) ? "✓" : ""}
                                        </span>
                                        <span className={styles.interestLabel}>{label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.interestsFooter}>
                                <span className={styles.selectedCount}>
                                    {interests.length} odabrano
                                </span>
                                <button
                                    className={styles.saveBtn}
                                    onClick={saveInterests}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <><span className={styles.btnSpinner}></span> Spremanje...</>
                                    ) : (
                                        "💾 Spremi interese"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Javni profil */}
                    {activeTab === "javni" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h1>🌍 Javni profil</h1>
                                <p>Informacije vidljive studentima koji traže instruktore</p>
                            </div>

                            <div className={styles.publicForm}>
                                <div className={styles.field}>
                                    <label>📝 Biografija</label>
                                    <textarea
                                        value={publicProfile.biography}
                                        onChange={e => setPublicProfile(p => ({ ...p, biography: e.target.value }))}
                                        placeholder="Opišite svoje iskustvo, pristup podučavanju i zašto ste dobar izbor za studente..."
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label>🎬 Video prezentacija (YouTube link)</label>
                                    <input
                                        value={publicProfile.video_url}
                                        onChange={e => setPublicProfile(p => ({ ...p, video_url: e.target.value }))}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label>🏆 Reference</label>
                                    <textarea
                                        value={publicProfile.reference}
                                        onChange={e => setPublicProfile(p => ({ ...p, reference: e.target.value }))}
                                        placeholder="Navedite svoje kvalifikacije, certifikate, uspjehe učenika..."
                                        rows={3}
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.field}>
                                        <label>💻 Način predavanja</label>
                                        <select
                                            value={publicProfile.teaching_type}
                                            onChange={e => setPublicProfile(p => ({ ...p, teaching_type: e.target.value }))}
                                        >
                                            <option value="">Odaberi</option>
                                            <option value="Uživo">🏫 Uživo</option>
                                            <option value="Online">💻 Online</option>
                                            <option value="Uživo i Online">🏫💻 Uživo i Online</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label>💰 Cijena po satu (€)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={publicProfile.price}
                                            onChange={e => setPublicProfile(p => ({ ...p, price: e.target.value }))}
                                            placeholder="20"
                                        />
                                    </div>
                                </div>

                                {(publicProfile.teaching_type === "Uživo" || publicProfile.teaching_type === "Uživo i Online") && (
                                    <div className={styles.field}>
                                        <label>📍 Lokacija predavanja</label>
                                        <input
                                            value={publicProfile.location}
                                            onChange={e => setPublicProfile(p => ({ ...p, location: e.target.value }))}
                                            placeholder="Zagreb – Centar, dolazim i na lokaciju studenta"
                                        />
                                    </div>
                                )}

                                <button 
                                    className={styles.saveBtn} 
                                    onClick={savePublicProfile}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <><span className={styles.btnSpinner}></span> Spremanje...</>
                                    ) : (
                                        "💾 Spremi javni profil"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sigurnost */}
                    {activeTab === "sigurnost" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h1>🔒 Sigurnost</h1>
                                <p>Upravljajte pristupom svom računu</p>
                            </div>

                            <div className={styles.comingSoon}>
                                <div className={styles.comingSoonIcon}>🔐</div>
                                <h3>Uskoro dostupno</h3>
                                <p>Promjena lozinke i dvofaktorska autentikacija bit će dostupne u sljedećoj verziji.</p>
                            </div>
                        </div>
                    )}

                    {/* Privatnost */}
                    {activeTab === "privatnost" && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <h1>🛡️ Privatnost</h1>
                                <p>Kontrolirajte vidljivost svojih podataka</p>
                            </div>

                            <div className={styles.comingSoon}>
                                <div className={styles.comingSoonIcon}>🛡️</div>
                                <h3>Uskoro dostupno</h3>
                                <p>Postavke privatnosti i upravljanje podacima bit će dostupni u sljedećoj verziji.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <ProfileImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                currentImage={form.profile_picture ? getImageUrl(form.profile_picture) : null}
                onImageUpdated={handleImageUpdated}
            />
        </div>
    );
}

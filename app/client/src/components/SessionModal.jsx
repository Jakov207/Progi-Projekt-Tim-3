import { useState, useEffect } from 'react';
import api from '../api';
import styles from './SessionModal.module.css';

export default function SessionModal({ bookingId, userRole, onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
        student_notes: '',
        instructor_summary: '',
        homework: ''
    });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get(`/sessions/session/${bookingId}`);
                if (res.data.record) {
                    setData({
                        student_notes: res.data.record.student_notes || '',
                        instructor_summary: res.data.record.instructor_summary || '',
                        homework: res.data.record.homework || ''
                    });
                }
            } catch (err) {
                console.error("Failed to load session record", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [bookingId]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            if (userRole === 'student') {
                await api.put(`/sessions/session/${bookingId}/notes`, {
                    notes: data.student_notes
                });
            } else {
                await api.put(`/sessions/session/${bookingId}/summary`, {
                    summary: data.instructor_summary,
                    homework: data.homework
                });
            }
            setMessage({ type: 'success', text: 'Uspješno spremljeno! ✓' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Greška pri spremanju.' });
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.loading}>Učitavanje...</div>
            </div>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <div className={styles.header}>
                    <h2>📝 Bilješke sa sesije</h2>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                {/* STUDENT SECTION */}
                <div className={styles.section}>
                    <label>Moje privatne bilješke</label>
                    <textarea
                        className={styles.textarea}
                        value={data.student_notes}
                        onChange={e => setData({ ...data, student_notes: e.target.value })}
                        readOnly={userRole !== 'student'}
                        placeholder={userRole === 'student' ? "Zapišite svoje bilješke ovdje..." : "(Studentove privatne bilješke)"}
                    />
                </div>

                {/* INSTRUCTOR SECTION */}
                <div className={styles.section}>
                    <label>Sažetak instruktora</label>
                    <textarea
                        className={styles.textarea}
                        value={data.instructor_summary}
                        onChange={e => setData({ ...data, instructor_summary: e.target.value })}
                        readOnly={userRole !== 'professor'}
                        placeholder={userRole === 'professor' ? "Napišite sažetak sata..." : "Sažetak koji je napisao instruktor..."}
                    />
                </div>

                <div className={styles.section}>
                    <label>Zadaća</label>
                    <textarea
                        className={styles.textarea}
                        value={data.homework}
                        onChange={e => setData({ ...data, homework: e.target.value })}
                        readOnly={userRole !== 'professor'}
                        placeholder={userRole === 'professor' ? "Zadajte zadaću..." : "Prazno"}
                    />
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>Zatvori</button>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Spremanje...' : 'Spremi'}
                    </button>
                </div>
            </div>
        </div>
    );
}

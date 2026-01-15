import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api";
import { getImageUrl } from "../api";
import styles from "./InstructorProfile.module.css";

export default function InstructorProfile() {
    const { id } = useParams();
    const [instructor, setInstructor] = useState(null);

    useEffect(() => {
        axios.get(`/instructors/${id}`).then(res => {
            setInstructor(res.data);
        });
    }, [id]);

    if (!instructor) return <p>Učitavanje...</p>;

    const youtubeId = instructor.video_url
        ? instructor.video_url.split("v=")[1]?.split("&")[0]
        : null;

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <img
                    src={instructor.profile_picture
                        ? getImageUrl(instructor.profile_picture)
                        : "/avatar.png"}
                    alt=""
                />

                <h1>{instructor.name} {instructor.surname}</h1>
                <p className={styles.city}>{instructor.city}</p>

                <div className={styles.info}>
                    <p><strong>Edukacija:</strong> {instructor.teaching}</p>
                    <p><strong>Način predavanja:</strong> {instructor.teaching_type}</p>
                    <p><strong>Cijena:</strong> {instructor.price} € / sat</p>
                </div>

                {instructor.interests?.length > 0 && (
                    <section className={styles.profileSection}>
                        <h3>Područja predavanja</h3>

                        <div className={styles.tags}>
                            {instructor.interests.map(subject => (
                                <span key={subject} className={styles.tag}>
                    {subject}
                </span>
                            ))}
                        </div>
                    </section>
                )}

                <section className={styles.profileSection}>
                    <h3>Biografija</h3>
                    <p>{instructor.biography}</p>
                </section>

                <section className={styles.profileSection}>
                    <h3>Reference</h3>
                    <p>{instructor.reference}</p>
                </section>

                <button className={styles.scheduleBtn}>
                    📅 Termini
                </button>

                {youtubeId && (
                    <div className={styles.video}>
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

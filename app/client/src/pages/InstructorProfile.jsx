import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api";
import { getImageUrl } from "../api";
import { AuthContext } from "../context/AuthContext";
import styles from "./InstructorProfile.module.css";

export default function InstructorProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [instructor, setInstructor] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [hoveredDay, setHoveredDay] = useState(null);
    const [bookingInProgress, setBookingInProgress] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [note, setNote] = useState("");
    const [selectedInterest, setSelectedInterest] = useState("");

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ average_rating: "0.0", total_reviews: 0 });
    const [canReview, setCanReview] = useState(false);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewError, setReviewError] = useState("");

    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const monthNames = [
        "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
        "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"
    ];

    const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

    useEffect(() => {
        axios.get(`/instructors/${id}`).then(res => {
            setInstructor(res.data);
        });
        fetchReviews();
    }, [id]);

    useEffect(() => {
        fetchSlots();
    }, [id]);

    useEffect(() => {
        if (user && !user.is_professor) {
            checkCanReview();
        }
    }, [id, user]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`/reviews/instructor/${id}`);
            setReviews(res.data.reviews || []);
            setReviewStats({
                average_rating: res.data.average_rating,
                total_reviews: res.data.total_reviews
            });
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    const checkCanReview = async () => {
        try {
            const res = await axios.get(`/reviews/can-review/${id}`);
            setCanReview(res.data.can_review);
            setReviewBooking(res.data.booking);
        } catch (err) {
            setCanReview(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewBooking) return;

        setReviewSubmitting(true);
        setReviewError("");

        try {
            await axios.post("/reviews", {
                booking_id: reviewBooking.booking_id,
                rating: reviewRating,
                comment: reviewComment
            });

            setReviewMessage("Recenzija uspješno dodana! ✓");
            setShowReviewModal(false);
            setReviewRating(5);
            setReviewComment("");
            fetchReviews();
            checkCanReview();
            setTimeout(() => setReviewMessage(""), 4000);
        } catch (err) {
            setReviewError(err.response?.data?.message || "Greška kod dodavanja recenzije");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const formatReviewDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("hr-HR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const renderStars = (rating, interactive = false, onSelect = null) => {
        return (
            <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={`${styles.star} ${star <= rating ? styles.starFilled : styles.starEmpty} ${interactive ? styles.starInteractive : ""}`}
                        onClick={() => interactive && onSelect && onSelect(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const fetchSlots = async () => {
        try {
            const res = await axios.get(`/calendar/slots/${id}`, {
                params: { includeBooked: true }
            });
            setSlots(res.data.slots || []);
        } catch (err) {
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // Minimalna cijena među svim dostupnim terminima instruktora
    const minSlotPrice = slots
        .filter(s => Number(s.booked_count || 0) < Number(s.capacity)) // samo dostupni termini
        .map(s => s.price)
        .filter(p => p != null) // ukloni null/undefined
        .reduce((min, price) => (min === null || price < min ? price : min), null);

    const handleBook = async (slotId, note, interest_id) => {
        setBookingError("");
        setBookingMessage("");

        if (!user) {
            navigate("/login");
            return;
        }

        setBookingInProgress(slotId);

        try {
            await axios.post(`/calendar/book/${slotId}`, {
                note,
                interest_id
            });
            setBookingMessage("Termin je uspješno rezerviran! ✓");
            fetchSlots();
            setTimeout(() => setBookingMessage(""), 4000);
        } catch (err) {
            setBookingError(err.response?.data?.message || "Greška pri rezervaciji termina.");
        } finally {
            setBookingInProgress(null);
        }
    };

    const formatTime = (value) => {
        const date = new Date(value);
        return date.toLocaleTimeString("hr-HR", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatFullDate = (value) => {
        const date = new Date(value);
        return date.toLocaleDateString("hr-HR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
    };

    const formatShortDate = (value) => {
        const date = new Date(value);
        return date.toLocaleDateString("hr-HR", {
            day: "numeric",
            month: "short"
        });
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    const startWeekday = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const buildCalendar = () => {
        const totalDays = daysInMonth(currentMonth);
        const offset = startWeekday(currentMonth);
        const days = [];

        for (let i = 0; i < offset; i += 1) days.push(null);
        for (let d = 1; d <= totalDays; d += 1) days.push(d);
        return days;
    };

    const dateKey = (date) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear()
        );
    };

    const isPast = (day) => {
        if (!day) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return checkDate < today;
    };

    const slotMap = slots.reduce((acc, slot) => {
        const key = dateKey(slot.start_time);
        acc[key] = acc[key] || [];
        acc[key].push(slot);
        return acc;
    }, {});

    const availableSlots = slots.filter(s => {
        const hasFreeSpace = Number(s.booked_count || 0) < Number(s.capacity);

        // ako je student već rezervirao → sakrij samo njemu
        if (s.is_booked_by_me) return false;

        return hasFreeSpace;
    });

    const filteredSlots = selectedDate
        ? availableSlots.filter(s => dateKey(s.start_time) === selectedDate)
        : availableSlots;

    const handleDaySelect = (day) => {
        if (!day) return;
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const date = String(day).padStart(2, "0");
        const newDate = `${year}-${month}-${date}`;
        
        if (selectedDate === newDate) {
            setSelectedDate("");
        } else {
            setSelectedDate(newDate);
        }
    };

    const isSelectedDay = (day) => {
        if (!day || !selectedDate) return false;
        const [y, m, d] = selectedDate.split("-");
        return (
            Number(y) === currentMonth.getFullYear() &&
            Number(m) === currentMonth.getMonth() + 1 &&
            Number(d) === day
        );
    };

    const getHoveredDayKey = () => {
        if (!hoveredDay) return null;
        return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(hoveredDay).padStart(2, "0")}`;
    };

    if (!instructor) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner}></div>
                <p>Učitavanje profila...</p>
            </div>
        );
    }

    const youtubeId = instructor.video_url
        ? instructor.video_url.split("v=")[1]?.split("&")[0]
        : null;

    const hoveredKey = getHoveredDayKey();
    const hoveredSlots = hoveredKey ? slotMap[hoveredKey] : null;

    return (
        <div className={styles.page}>
            {/* Review Modal */}
            {showReviewModal && reviewBooking && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Ostavi recenziju</h3>

                        <div className={styles.modalInfo}>
                            <p>📘 {reviewBooking.interest_name}</p>
                            <p>📅 {formatReviewDate(reviewBooking.end_time)}</p>
                        </div>

                        <label>Ocjena</label>
                        <div className={styles.ratingSelector}>
                            {renderStars(reviewRating, true, setReviewRating)}
                            <span className={styles.ratingText}>{reviewRating}/5</span>
                        </div>

                        <label>Komentar (opcionalno)</label>
                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Opišite svoje iskustvo s instruktorom..."
                            maxLength={500}
                        />
                        <div className={styles.charCount}>{reviewComment.length}/500</div>

                        {reviewError && (
                            <div className={styles.modalError}>{reviewError}</div>
                        )}

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setReviewError("");
                                }}
                            >
                                Odustani
                            </button>

                            <button
                                className={styles.confirmBtn}
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitting}
                            >
                                {reviewSubmitting ? (
                                    <span className={styles.btnSpinner}></span>
                                ) : (
                                    "Objavi recenziju"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBookingModal && selectedSlot && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Potvrda rezervacije</h3>

                        <div className={styles.modalInfo}>
                            <p>📅 {formatFullDate(selectedSlot.start_time)}</p>
                            <p>🕐 {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}</p>

                            {selectedSlot.lesson_type === "1na1" ? (
                                <p>👤 {selectedSlot.lesson_type}</p>
                            ):(
                                <p>👥 {selectedSlot.lesson_type}</p>
                            )}
                            {selectedSlot.lesson_type === "Grupno" && selectedSlot.interest_name && (
                                <p>📘 {selectedSlot.interest_name}</p>
                            )}
                            <p>🎓 {selectedSlot.teaching_type}</p>
                            {selectedSlot.teaching_type === "Uživo" && selectedSlot.location && (
                                <p>📍 {selectedSlot.location}</p>
                            )}

                            <p>💰 {selectedSlot.price}€</p>
                        </div>

                        {selectedSlot.lesson_type === "1na1" && (
                            <>
                                <label>Predmet</label>
                                <select
                                    value={selectedInterest}
                                    onChange={(e) => setSelectedInterest(e.target.value)}
                                >
                                    <option value="">-- Odaberi predmet --</option>
                                    {instructor.interests.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        <label>Bilješka za instruktora</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Npr. trebam pomoć oko..."
                        />

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowBookingModal(false)}
                            >
                                Odustani
                            </button>

                            <button
                                className={styles.confirmBtn}
                                onClick={() => {
                                    handleBook(selectedSlot.id, note, selectedInterest);
                                    setShowBookingModal(false);
                                    setNote("");
                                    setSelectedInterest("");
                                }}
                                disabled={!selectedInterest && selectedSlot.lesson_type === "1na1"}
                            >
                                Rezerviraj
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Success Banner */}
            {(bookingMessage || reviewMessage) && (
                <div className={styles.successBanner}>
                    {bookingMessage || reviewMessage}
                </div>
            )}

            {/* Error Banner */}
            {bookingError && (
                <div className={styles.errorBanner}>
                    ⚠️ {bookingError}
                    <button onClick={() => setBookingError("")} className={styles.dismissBtn}>×</button>
                </div>
            )}

            <div className={styles.profileGrid}>
                {/* Left Column - Instructor Info */}
                <div className={styles.profileCard}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            <img
                                src={instructor.profile_picture
                                    ? getImageUrl(instructor.profile_picture)
                                    : "/avatar.png"}
                                alt={`${instructor.name} ${instructor.surname}`}
                            />
                            <div className={styles.statusBadge}>
                                {availableSlots.length > 0 ? "🟢 Dostupan" : "🔴 Zauzet"}
                            </div>
                        </div>
                        
                        <h1>{instructor.name} {instructor.surname}</h1>
                        
                        {instructor.city && (
                            <p className={styles.location}>
                                📍 {instructor.city}
                            </p>
                        )}
                    </div>

                    <div className={styles.statsRow}>
                        {reviewStats.total_reviews > 0 && (
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>
                                    ⭐ {reviewStats.average_rating}
                                </span>
                                <span className={styles.statLabel}>{reviewStats.total_reviews} recenzija</span>
                            </div>
                        )}
                        {minSlotPrice != null && (
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>Od {minSlotPrice}€</span>
                                <span className={styles.statLabel}>po satu</span>
                            </div>
                        )}
                        {instructor.teaching_type && (
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>
                                    {instructor.teaching_type === "online" ? "💻" : instructor.teaching_type === "uzivo" ? "🏫" : "💻🏫"}
                                </span>
                                <span className={styles.statLabel}>{instructor.teaching_type}</span>
                            </div>
                        )}
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{availableSlots.length}</span>
                            <span className={styles.statLabel}>slobodnih termina</span>
                        </div>
                    </div>

                    {instructor.interests?.length > 0 && (
                        <div className={styles.section}>
                            <h3>🎓 Područja predavanja</h3>
                            <div className={styles.tags}>
                                {instructor.interests.map(i => (
                                    <span key={i.id} className={styles.tag}>
                                        {i.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {instructor.biography && (
                        <div className={styles.section}>
                            <h3>📝 O meni</h3>
                            <p className={styles.bioText}>{instructor.biography}</p>
                        </div>
                    )}

                    {instructor.reference && (
                        <div className={styles.section}>
                            <h3>🏆 Reference</h3>
                            <p className={styles.bioText}>{instructor.reference}</p>
                        </div>
                    )}

                    {youtubeId && (
                        <div className={styles.section}>
                            <h3>🎬 Video prezentacija</h3>
                            <div className={styles.video}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="YouTube video"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className={styles.section}>
                        <div className={styles.reviewsHeader}>
                            <h3>⭐ Recenzije</h3>
                            {canReview && (
                                <button
                                    className={styles.addReviewBtn}
                                    onClick={() => setShowReviewModal(true)}
                                >
                                    + Ostavi recenziju
                                </button>
                            )}
                        </div>

                        {reviewStats.total_reviews > 0 && (
                            <div className={styles.ratingOverview}>
                                <div className={styles.ratingBig}>
                                    {reviewStats.average_rating}
                                </div>
                                <div className={styles.ratingDetails}>
                                    {renderStars(Math.round(parseFloat(reviewStats.average_rating)))}
                                    <span className={styles.reviewCount}>
                                        {reviewStats.total_reviews} {reviewStats.total_reviews === 1 ? "recenzija" : "recenzije"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <div className={styles.noReviews}>
                                <p>Još nema recenzija za ovog instruktora.</p>
                                {canReview && (
                                    <p>Budite prvi koji će ostaviti recenziju!</p>
                                )}
                            </div>
                        ) : (
                            <div className={styles.reviewsList}>
                                {reviews.map(review => (
                                    <div key={review.id} className={styles.reviewCard}>
                                        <div className={styles.reviewHeader}>
                                            <img
                                                src={review.student_picture
                                                    ? getImageUrl(review.student_picture)
                                                    : "/avatar.png"}
                                                alt={`${review.student_name} ${review.student_surname}`}
                                                className={styles.reviewAvatar}
                                            />
                                            <div className={styles.reviewMeta}>
                                                <span className={styles.reviewAuthor}>
                                                    {review.student_name} {review.student_surname}
                                                </span>
                                                <span className={styles.reviewSubject}>
                                                    {review.interest_name}
                                                </span>
                                            </div>
                                            <div className={styles.reviewRating}>
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className={styles.reviewComment}>
                                                "{review.comment}"
                                            </p>
                                        )}
                                        <span className={styles.reviewDate}>
                                            {formatReviewDate(review.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Calendar & Booking */}
                <div className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                        <h2>📅 Rezerviraj termin</h2>
                        <p>Odaberite dan u kalendaru ili pregledajte sve termine ispod</p>
                    </div>

                    {slotsLoading ? (
                        <div className={styles.loadingSlots}>
                            <div className={styles.spinnerSmall}></div>
                            <p>Učitavanje termina...</p>
                        </div>
                    ) : (
                        <>
                            {/* Calendar */}
                            <div className={styles.calendarSection}>
                                <div className={styles.calendarHeader}>
                                    <button
                                        className={styles.navBtn}
                                        onClick={() =>
                                            setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                                        }
                                    >
                                        ←
                                    </button>
                                    <div className={styles.monthLabel}>
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </div>
                                    <button
                                        className={styles.navBtn}
                                        onClick={() =>
                                            setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                                        }
                                    >
                                        →
                                    </button>
                                </div>

                                <div className={styles.weekdays}>
                                    {dayNames.map(day => (
                                        <span key={day}>{day}</span>
                                    ))}
                                </div>

                                <div className={styles.calendarGrid}>
                                    {buildCalendar().map((day, idx) => {
                                        const key = day
                                            ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                                            : null;
                                        const daySlots = key ? slotMap[key] || [] : [];
                                        const availableCount = daySlots.filter(s => Number(s.booked_count || 0) < Number(s.capacity)).length;
                                        const dayIsPast = isPast(day);
                                        const dayIsToday = isToday(day);

                                        let dayClass = styles.day;
                                        if (isSelectedDay(day)) dayClass += ` ${styles.selectedDay}`;
                                        if (dayIsToday) dayClass += ` ${styles.today}`;
                                        if (dayIsPast) dayClass += ` ${styles.pastDay}`;
                                        if (availableCount > 0) dayClass += ` ${styles.hasSlots}`;

                                        return (
                                            <button
                                                key={`${day || "empty"}-${idx}`}
                                                className={dayClass}
                                                disabled={!day}
                                                onClick={() => handleDaySelect(day)}
                                                onMouseEnter={() => setHoveredDay(day)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            >
                                                <span className={styles.dayNumber}>{day || ""}</span>
                                                {availableCount > 0 && (
                                                    <span className={styles.badge}>{availableCount}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tooltip */}
                                {hoveredDay && hoveredSlots && hoveredSlots.length > 0 && (
                                    <div className={styles.tooltip}>
                                        <div className={styles.tooltipDate}>
                                            {hoveredDay}. {monthNames[currentMonth.getMonth()]}
                                        </div>
                                        <div className={styles.tooltipContent}>
                                            {hoveredSlots.map((slot, i) => {
                                                const isAvailable = Number(slot.booked_count || 0) < Number(slot.capacity);
                                                return (
                                                    <div key={i} className={`${styles.tooltipItem} ${!isAvailable ? styles.tooltipItemFull : ""}`}>
                                                        🕐 {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                        <span className={styles.tooltipBadge}>
                                                            {isAvailable ? "Slobodno" : "Popunjeno"}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.legend}>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendDot} ${styles.legendToday}`}></span>
                                        Danas
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendDot} ${styles.legendAvailable}`}></span>
                                        Slobodni termini
                                    </div>
                                </div>
                            </div>

                            {/* Slot List */}
                            <div className={styles.slotSection}>
                                <div className={styles.slotHeader}>
                                    <h3>
                                        {selectedDate 
                                            ? `Termini za ${formatFullDate(selectedDate)}`
                                            : "Svi dostupni termini"
                                        }
                                    </h3>
                                    {selectedDate && (
                                        <button 
                                            className={styles.clearFilter}
                                            onClick={() => setSelectedDate("")}
                                        >
                                            Prikaži sve ×
                                        </button>
                                    )}
                                </div>

                                {filteredSlots.length === 0 ? (
                                    <div className={styles.emptySlots}>
                                        <div className={styles.emptyIcon}>📭</div>
                                        <p>{selectedDate ? "Nema termina za odabrani dan" : "Trenutno nema dostupnih termina"}</p>
                                        <span>Pokušajte odabrati drugi dan ili se vratite kasnije</span>
                                    </div>
                                ) : (
                                    <div className={styles.slotList}>
                                        {filteredSlots.map(slot => (
                                            <div key={slot.id} className={styles.slotCard}>
                                                <div className={styles.slotInfo}>
                                                    <div className={styles.slotDate}>
                                                        📅 {formatShortDate(slot.start_time)}
                                                    </div>
                                                    <div className={styles.slotTime}>
                                                        🕐 {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                                    </div>
                                                    <div className={styles.slotMeta}>
                                                        <span className={styles.slotType}>
                                                            {slot.teaching_type === "Online" && "💻 Online"}
                                                            {slot.teaching_type === "Uživo" && "🏫 Uživo"}
                                                        </span>

                                                            {slot.price != null && (
                                                                <span className={styles.slotPrice}>
                                                                💰 {slot.price}€
                                                                </span>
                                                            )}
                                                    </div>
                                                    <div className={styles.slotMeta}>
                                                        <span className={styles.slotLessonType}>
                                                            🎓 {slot.lesson_type === "1na1" ? "1 na 1" : "Grupno"}
                                                        </span>

                                                        {slot.lesson_type === "Grupno" && slot.interest_name && (
                                                            <span className={styles.slotInterest}>
                                                                📘 {slot.interest_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={styles.slotCapacity}>
                                                        👥 {Number(slot.capacity) - Number(slot.booked_count || 0)} mjesta preostalo
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.bookBtn}
                                                    onClick={() => {
                                                        setSelectedSlot(slot);
                                                        setShowBookingModal(true);
                                                    }}
                                                    disabled={bookingInProgress === slot.id}
                                                >
                                                    {bookingInProgress === slot.id ? (
                                                        <span className={styles.btnSpinner}></span>
                                                    ) : (
                                                        "Rezerviraj"
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!user && (
                                <div className={styles.loginPrompt}>
                                    <p>🔐 Za rezervaciju termina potrebna je prijava</p>
                                    <button onClick={() => navigate("/login")} className={styles.loginBtn}>
                                        Prijavi se
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

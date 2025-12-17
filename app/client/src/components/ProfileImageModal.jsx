import React, { useState, useRef } from 'react';
import { uploadProfileImage, deleteProfileImage } from '../api';
import styles from './ProfileImageModal.module.css'; // ✅ DODAJ OVO

const ProfileImageModal = ({ isOpen, onClose, currentImage, onImageUpdated }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError('');
        try {
            const data = await uploadProfileImage(selectedImage);
            onImageUpdated(data.filename);
            setSelectedImage(null);
            setPreview(null);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri uploadu');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentImage) return;

        setLoading(true);
        setError('');
        try {
            await deleteProfileImage();
            onImageUpdated(null);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri brisanju');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedImage(null);
        setPreview(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>
                    ×
                </button>

                <h2 className={styles.title}>Uredi Profilnu Sliku</h2>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.imagePreview}>
                    {preview ? (
                        <img src={preview} alt="Preview" className={styles.previewImage} />
                    ) : currentImage ? (
                        <img src={currentImage} alt="Current" className={styles.previewImage} />
                    ) : (
                        <div className={styles.placeholder}>Nema slike</div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className={styles.fileInput}
                />

                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        <i className="fa-solid fa-folder-open"></i> Odaberi novu sliku
                    </button>

                    {currentImage && !selectedImage && (
                        <button
                            className={styles.actionBtn}
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <i className="fa-solid fa-trash"></i> Obriši sliku
                        </button>
                    )}
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        className={styles.cancelBtn}
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Odustani
                    </button>

                    {selectedImage && (
                        <button
                            className={styles.saveBtn}
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            {loading ? 'Spremanje...' : 'Spremi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileImageModal;
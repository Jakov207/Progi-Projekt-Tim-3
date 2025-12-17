import { useState, useRef } from 'react';
import styles from './ProfileImageModal.module.css';
import { uploadProfileImage, deleteProfileImage, getImageUrl } from '../api';

const ProfileImageModal = ({ isOpen, onClose, currentImage, onImageUpdated }) => {
    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Dozvoljeni su samo jpg, png, gif i webp formati');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Slika ne smije biti veća od 5MB');
            return;
        }

        setError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Molimo odaberite sliku');
            return;
        }

        try {
            setIsUploading(true);
            const response = await uploadProfileImage(selectedFile);
            onImageUpdated(response.filename);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri uploadu slike');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentImage) return;

        try {
            setIsUploading(true);
            await deleteProfileImage();
            onImageUpdated(null);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Greška pri brisanju slike');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setPreview(null);
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    return (
        <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={handleClose}>&times;</button>

                <h2 className={styles.title}>Profilna Slika</h2>

                <div className={styles.imagePreview}>
                    {preview ? (
                        <img src={preview} alt="Preview" className={styles.previewImage} />
                    ) : currentImage ? (
                        <img src={currentImage} alt="Current" className={styles.previewImage} />
                    ) : (
                        <div className={styles.placeholder}>Nema slike</div>
                    )}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.actions}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className={styles.fileInput}
                    />
                    <button
                        className={styles.actionBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        📁 Odaberi sliku
                    </button>

                    {currentImage && (
                        <button
                            className={styles.actionBtn}
                            onClick={handleDelete}
                            disabled={isUploading}
                        >
                            🗑️ Obriši sliku
                        </button>
                    )}
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        className={styles.cancelBtn}
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        Odustani
                    </button>
                    <button
                        className={styles.saveBtn}
                        onClick={handleUpload}
                        disabled={isUploading || !selectedFile}
                    >
                        {isUploading ? 'Spremanje...' : 'Spremi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileImageModal;
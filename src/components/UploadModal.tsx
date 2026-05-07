'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, AlertCircle } from 'lucide-react';
import styles from './UploadModal.module.css';
import { uploadToStorage, saveDocumentMetadata } from '@/lib/supabase';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    // Validate size (e.g., max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to Storage
      const { path, error: uploadError } = await uploadToStorage(file);
      
      if (uploadError || !path) {
        throw new Error(uploadError?.message || 'Failed to upload to storage');
      }

      // 2. Save metadata to DB
      const { error: dbError } = await saveDocumentMetadata({
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: path
      });

      if (dbError) {
        throw new Error(dbError.message || 'Failed to save metadata');
      }

      // Success
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} disabled={isUploading}>
          <X size={24} />
        </button>
        
        <h2 className={styles.title}>Upload Document</h2>
        
        {!file ? (
          <div 
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} className={styles.uploadIcon} />
            <p className={styles.dropText}>Click or drag file to this area to upload</p>
            <p className={styles.supportText}>Supports PDF, DOCX, XLSX, PPTX, TXT, Images</p>
            <input 
              type="file" 
              className={styles.fileInput} 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.pptx,.txt,image/*"
            />
          </div>
        ) : (
          <div className={styles.selectedFile}>
            <div className={styles.fileInfo}>
              <File size={24} className={styles.uploadIcon} style={{ marginBottom: 0 }} />
              <div>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            {!isUploading && (
              <button className={styles.removeFileBtn} onClick={() => setFile(null)}>
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {isUploading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressText}>
              <span>Uploading...</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '100%', animation: 'pulse 2s infinite' }}></div>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            className={styles.uploadBtn} 
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

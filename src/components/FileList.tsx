'use client';

import React from 'react';
import { FileText, FileImage, FileCode, File, Download, Eye, Trash2, FileBox } from 'lucide-react';
import styles from './FileList.module.css';
import { DocumentMeta, deleteDocument, getFileUrl } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

interface FileListProps {
  documents: DocumentMeta[];
}

export default function FileList({ documents }: FileListProps) {
  const { openViewer, removeDocument } = useStore();

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={20} />;
    if (type.includes('image')) return <FileImage size={20} />;
    if (type.includes('text') || type.includes('doc')) return <FileCode size={20} />;
    return <File size={20} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOpen = async (doc: DocumentMeta) => {
    const { url, error } = await getFileUrl(doc.storage_path, false);
    if (url && !error) {
      openViewer(url, doc.file_type, doc.file_name);
    } else {
      alert('Failed to open file. ' + (error?.message || ''));
    }
  };

  const handleDownload = async (doc: DocumentMeta) => {
    const { url, error } = await getFileUrl(doc.storage_path, true);
    if (url && !error) {
      // Create a temporary anchor to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (doc: DocumentMeta) => {
    if (window.confirm(`Are you sure you want to delete ${doc.file_name}?`)) {
      const { error } = await deleteDocument(doc.id, doc.storage_path);
      if (!error) {
        removeDocument(doc.id);
      } else {
        alert('Failed to delete document.');
      }
    }
  };

  if (documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileBox size={48} color="var(--border)" />
        <p>No documents found. Upload a file to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={`${styles.th} ${styles.hideMobile}`}>Date</th>
            <th className={`${styles.th} ${styles.hideMobile}`}>Size</th>
            <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className={styles.tr}>
              <td className={styles.td}>
                <div className={styles.fileInfo}>
                  <div className={styles.iconWrapper}>
                    {getIcon(doc.file_type)}
                  </div>
                  <div>
                    <div className={styles.fileName} title={doc.file_name}>{doc.file_name}</div>
                    <div className={styles.fileType}>{doc.file_type.split('/')[1] || doc.file_type}</div>
                  </div>
                </div>
              </td>
              <td className={`${styles.td} ${styles.hideMobile}`}>
                <div className={styles.date}>
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>
              </td>
              <td className={`${styles.td} ${styles.hideMobile}`}>
                <div className={styles.size}>{formatSize(doc.file_size)}</div>
              </td>
              <td className={styles.td}>
                <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => handleOpen(doc)}
                    title="Open"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={() => handleDelete(doc)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

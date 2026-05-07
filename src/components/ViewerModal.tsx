'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { X, Download, FileText } from 'lucide-react';
import styles from './ViewerModal.module.css';
import { useStore } from '@/store/useStore';
import ImageViewer from '@/viewers/ImageViewer';
import TextViewer from '@/viewers/TextViewer';

const PdfViewer = dynamic(() => import('@/viewers/PdfViewer'), {
  ssr: false,
  loading: () => <div style={{ color: 'white', padding: '2rem' }}>Loading PDF viewer...</div>
});

export default function ViewerModal() {
  const { viewer, closeViewer } = useStore();

  if (!viewer.isOpen || !viewer.fileUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = viewer.fileUrl!;
    a.download = viewer.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderViewer = () => {
    const type = viewer.fileType || '';
    
    if (type.includes('pdf')) {
      return <PdfViewer url={viewer.fileUrl!} />;
    }
    if (type.includes('image')) {
      return <ImageViewer url={viewer.fileUrl!} name={viewer.fileName || 'Image'} />;
    }
    if (type.includes('text')) {
      return <TextViewer url={viewer.fileUrl!} />;
    }
    
    // Fallback for unsupported types
    return (
      <div className={styles.unsupported}>
        <FileText size={64} opacity={0.5} />
        <p>Preview not available for this file type.</p>
        <button onClick={handleDownload} className={styles.downloadLink}>
          Download file instead
        </button>
      </div>
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FileText size={20} />
          {viewer.fileName}
        </div>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleDownload} title="Download">
            <Download size={20} />
          </button>
          <button className={`${styles.actionBtn} ${styles.closeBtn}`} onClick={closeViewer} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className={styles.content}>
        {renderViewer()}
      </div>
    </div>
  );
}

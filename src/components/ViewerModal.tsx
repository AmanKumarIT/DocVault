'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Download, FileText, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isImmersive, setIsImmersive] = useState(false);
  const [showRevealPill, setShowRevealPill] = useState(false);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  if (!viewer.isOpen || !viewer.fileUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = viewer.fileUrl!;
    a.download = viewer.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleImmersive = () => {
    setIsImmersive(prev => {
      const next = !prev;
      if (next) {
        // Entering immersive: show reveal pill after a brief delay
        setTimeout(() => setShowRevealPill(true), 400);
      } else {
        setShowRevealPill(false);
      }
      return next;
    });
  };

  const exitImmersive = () => {
    setIsImmersive(false);
    setShowRevealPill(false);
  };

  // Handle tap on content area to toggle header (mobile)
  const handleContentTap = (e: React.MouseEvent) => {
    // Only toggle on direct click on the content backdrop, not on child elements
    if (e.target === e.currentTarget) {
      toggleImmersive();
    }
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
      {/* Header bar — slides away in immersive mode */}
      <div className={`${styles.header} ${isImmersive ? styles.headerHidden : ''}`}>
        <div className={styles.title}>
          <FileText size={20} className={styles.titleIcon} />
          <span className={styles.titleText}>{viewer.fileName}</span>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.actionBtn} 
            onClick={toggleImmersive} 
            title={isImmersive ? 'Exit immersive' : 'Immersive mode'}
          >
            {isImmersive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button className={styles.actionBtn} onClick={handleDownload} title="Download">
            <Download size={20} />
          </button>
          <button className={`${styles.actionBtn} ${styles.closeBtn}`} onClick={closeViewer} title="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Reveal pill — shows when header is hidden */}
      {isImmersive && showRevealPill && (
        <button className={styles.revealPill} onClick={exitImmersive} title="Show header">
          <Minimize2 size={14} />
          <span>Tap to show header</span>
        </button>
      )}

      <div className={`${styles.content} ${isImmersive ? styles.contentImmersive : ''}`} onClick={handleContentTap}>
        {renderViewer()}
      </div>
    </div>
  );
}

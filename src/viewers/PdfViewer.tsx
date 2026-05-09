'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [jumpInput, setJumpInput] = useState<string>('');
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setCurrentPage(1);
  }

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(page, numPages));
    setCurrentPage(clamped);
  }, [numPages]);

  const handleJump = () => {
    const page = parseInt(jumpInput, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      goToPage(page);
      setJumpInput('');
    }
  };

  const handleJumpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJump();
  };

  // Dial wheel scroll handler
  const handleDialWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentPage(p => Math.min(p + 1, numPages));
    } else if (e.deltaY < 0) {
      setCurrentPage(p => Math.max(p - 1, 1));
    }
  }, [numPages]);

  // Dial drag handlers
  const handleDialMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastY.current = e.clientY;
    document.body.style.userSelect = 'none';
  }, []);

  const handleDialMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = lastY.current - e.clientY;
    if (Math.abs(delta) > 18) {
      if (delta > 0) {
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
      lastY.current = e.clientY;
    }
  }, [numPages]);

  const handleDialMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  }, []);

  // Attach dial wheel event (passive: false required for preventDefault)
  useEffect(() => {
    const dial = dialRef.current;
    if (!dial) return;
    dial.addEventListener('wheel', handleDialWheel, { passive: false });
    return () => dial.removeEventListener('wheel', handleDialWheel);
  }, [handleDialWheel]);

  // Attach drag listeners on document for smooth dragging
  useEffect(() => {
    document.addEventListener('mousemove', handleDialMouseMove);
    document.addEventListener('mouseup', handleDialMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleDialMouseMove);
      document.removeEventListener('mouseup', handleDialMouseUp);
    };
  }, [handleDialMouseMove, handleDialMouseUp]);

  // Generate dial tick marks around current page
  const dialTicks = [];
  const visibleRange = 4;
  for (let i = currentPage - visibleRange; i <= currentPage + visibleRange; i++) {
    dialTicks.push(i);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top toolbar */}
      <div style={{ 
        padding: '10px 16px', 
        background: '#1e293b', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'white',
        borderBottom: '1px solid #334155',
        flexWrap: 'wrap'
      }}>
        {/* Page navigation */}
        <button 
          onClick={() => goToPage(currentPage - 1)} 
          disabled={currentPage <= 1}
          style={{
            background: currentPage <= 1 ? '#334155' : '#3b82f6',
            color: currentPage <= 1 ? '#64748b' : 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          ◀ Prev
        </button>

        <span style={{ fontSize: '14px', color: '#94a3b8' }}>
          Page {currentPage} of {numPages}
        </span>

        <button 
          onClick={() => goToPage(currentPage + 1)} 
          disabled={currentPage >= numPages}
          style={{
            background: currentPage >= numPages ? '#334155' : '#3b82f6',
            color: currentPage >= numPages ? '#64748b' : 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Next ▶
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: '#475569' }}></div>

        {/* Jump to page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Go to:</label>
          <input
            type="number"
            min={1}
            max={numPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={handleJumpKeyDown}
            placeholder="#"
            style={{
              width: '56px',
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
              color: 'white',
              fontSize: '13px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
          <button
            onClick={handleJump}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            Go
          </button>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: '#475569' }}></div>

        {/* Zoom controls */}
        <button 
          onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          style={{
            background: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          −
        </button>
        <span style={{ fontSize: '13px', color: '#94a3b8', minWidth: '40px', textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={() => setScale(s => Math.min(3, s + 0.2))}
          style={{
            background: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          +
        </button>
      </div>

      {/* Main area with page view and dial */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Page display area */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0f172a'
        }}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
          >
            <div style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)', borderRadius: '4px', overflow: 'hidden' }}>
              <Page 
                pageNumber={currentPage} 
                scale={scale} 
                renderTextLayer={false} 
                renderAnnotationLayer={false}
              />
            </div>
          </Document>
        </div>

        {/* Dial bar navigator */}
        {numPages > 1 && (
          <div
            ref={dialRef}
            onMouseDown={handleDialMouseDown}
            style={{
              width: '56px',
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
              borderLeft: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'ns-resize',
              userSelect: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Dial label */}
            <div style={{
              position: 'absolute',
              top: '8px',
              fontSize: '9px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 700
            }}>
              Dial
            </div>

            {/* Dial ticks */}
            {dialTicks.map((pageNum) => {
              const isCurrent = pageNum === currentPage;
              const isValid = pageNum >= 1 && pageNum <= numPages;
              const distance = Math.abs(pageNum - currentPage);

              return (
                <div
                  key={pageNum}
                  onClick={() => isValid ? goToPage(pageNum) : null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: `${isCurrent ? 36 : 28}px`,
                    cursor: isValid ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Tick line */}
                  <div style={{
                    width: isCurrent ? '28px' : `${Math.max(8, 20 - distance * 4)}px`,
                    height: isCurrent ? '3px' : '2px',
                    background: !isValid 
                      ? 'transparent' 
                      : isCurrent 
                        ? '#3b82f6' 
                        : `rgba(148, 163, 184, ${Math.max(0.15, 0.6 - distance * 0.12)})`,
                    borderRadius: '2px',
                    transition: 'all 0.2s ease'
                  }} />

                  {/* Page number label for current */}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute',
                      right: '100%',
                      marginRight: '-48px',
                      bottom: '-14px',
                      fontSize: '10px',
                      color: '#3b82f6',
                      fontWeight: 700,
                      width: '100%',
                      textAlign: 'center'
                    }}>
                      {pageNum}
                    </div>
                  )}

                  {/* Edge page labels */}
                  {isValid && !isCurrent && distance === visibleRange && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-12px',
                      fontSize: '8px',
                      color: '#475569',
                      width: '100%',
                      textAlign: 'center'
                    }}>
                      {pageNum}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Scroll hint */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              fontSize: '8px',
              color: '#475569',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              ▲▼
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

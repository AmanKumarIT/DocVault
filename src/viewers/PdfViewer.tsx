'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './PdfViewer.module.css';

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
  const [showShortcutHint, setShowShortcutHint] = useState(true);

  // Refs
  const dialRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const pageDisplayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const lastX = useRef(0);

  // Swipe tracking
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isSwiping = useRef(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setCurrentPage(1);
    autoFitScale();
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

  // Auto-fit: calculate scale to fit page width in container
  const autoFitScale = useCallback(() => {
    if (!pageDisplayRef.current) return;
    const containerWidth = pageDisplayRef.current.clientWidth - 32; // account for padding
    // Default PDF page width at scale 1.0 is ~612px (letter size)
    const defaultPageWidth = 612;
    const fitScale = Math.min(containerWidth / defaultPageWidth, 2.0);
    setScale(Math.max(0.5, Math.round(fitScale * 10) / 10));
  }, []);

  // ===== DIAL: Mouse handlers =====
  const handleDialWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentPage(p => Math.min(p + 1, numPages));
    } else if (e.deltaY < 0) {
      setCurrentPage(p => Math.max(p - 1, 1));
    }
  }, [numPages]);

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

  // ===== DIAL: Touch handlers (for vertical dial on tablet+) =====
  const handleDialTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    lastY.current = e.touches[0].clientY;
  }, []);

  const handleDialTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault(); // prevent page scroll
    const touch = e.touches[0];
    const delta = lastY.current - touch.clientY;
    if (Math.abs(delta) > 18) {
      if (delta > 0) {
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
      lastY.current = touch.clientY;
    }
  }, [numPages]);

  const handleDialTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ===== SCRUBBER: Touch handlers (horizontal, mobile) =====
  const handleScrubberTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    lastX.current = e.touches[0].clientX;
  }, []);

  const handleScrubberTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const delta = touch.clientX - lastX.current;
    if (Math.abs(delta) > 20) {
      if (delta > 0) {
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
      lastX.current = touch.clientX;
    }
  }, [numPages]);

  const handleScrubberTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Scrubber mouse drag (for desktop testing)
  const handleScrubberMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    document.body.style.userSelect = 'none';
  }, []);

  const handleScrubberMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastX.current;
    if (Math.abs(delta) > 20) {
      if (delta > 0) {
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
      lastX.current = e.clientX;
    }
  }, [numPages]);

  // ===== SWIPE: Page navigation via horizontal swipe on document =====
  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  }, []);

  const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - swipeStartX.current;
    const diffY = endY - swipeStartY.current;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX < 0) {
        // Swipe left → next page
        setCurrentPage(p => Math.min(p + 1, numPages));
      } else {
        // Swipe right → prev page
        setCurrentPage(p => Math.max(p - 1, 1));
      }
    }
    isSwiping.current = false;
  }, [numPages]);

  // ===== KEYBOARD shortcuts =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentPage(p => Math.max(p - 1, 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentPage(p => Math.min(p + 1, numPages));
          break;
        case '+':
        case '=':
          e.preventDefault();
          setScale(s => Math.min(3, s + 0.2));
          break;
        case '-':
          e.preventDefault();
          setScale(s => Math.max(0.5, s - 0.2));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // ===== Auto-dismiss shortcut hint =====
  useEffect(() => {
    const timer = setTimeout(() => setShowShortcutHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ===== Attach dial wheel event (passive: false for preventDefault) =====
  useEffect(() => {
    const dial = dialRef.current;
    if (!dial) return;
    dial.addEventListener('wheel', handleDialWheel, { passive: false });
    return () => dial.removeEventListener('wheel', handleDialWheel);
  }, [handleDialWheel]);

  // Attach dial touch events
  useEffect(() => {
    const dial = dialRef.current;
    if (!dial) return;
    dial.addEventListener('touchmove', handleDialTouchMove, { passive: false });
    dial.addEventListener('touchend', handleDialTouchEnd);
    return () => {
      dial.removeEventListener('touchmove', handleDialTouchMove);
      dial.removeEventListener('touchend', handleDialTouchEnd);
    };
  }, [handleDialTouchMove, handleDialTouchEnd]);

  // Attach scrubber touch events
  useEffect(() => {
    const scrubber = scrubberRef.current;
    if (!scrubber) return;
    scrubber.addEventListener('touchmove', handleScrubberTouchMove, { passive: false });
    scrubber.addEventListener('touchend', handleScrubberTouchEnd);
    return () => {
      scrubber.removeEventListener('touchmove', handleScrubberTouchMove);
      scrubber.removeEventListener('touchend', handleScrubberTouchEnd);
    };
  }, [handleScrubberTouchMove, handleScrubberTouchEnd]);

  // Attach mouse drag listeners on document for smooth dragging (dial + scrubber)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDialMouseMove(e);
      handleScrubberMouseMove(e);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDialMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDialMouseUp);
    };
  }, [handleDialMouseMove, handleScrubberMouseMove, handleDialMouseUp]);

  // ===== Auto-fit on window resize =====
  useEffect(() => {
    const handleResize = () => autoFitScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoFitScale]);

  // ===== Dial tick generation =====
  const dialTicks = [];
  const visibleRange = 4;
  for (let i = currentPage - visibleRange; i <= currentPage + visibleRange; i++) {
    dialTicks.push(i);
  }

  // ===== Scrubber tick generation (more ticks for mobile) =====
  const scrubberVisibleRange = 6;
  const scrubberTicks = [];
  for (let i = currentPage - scrubberVisibleRange; i <= currentPage + scrubberVisibleRange; i++) {
    scrubberTicks.push(i);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Top toolbar (desktop) / Bottom toolbar (mobile) */}
      <div className={styles.toolbar}>
        {/* Page navigation */}
        <button
          className={styles.toolbarBtn}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page (← key)"
        >
          ◀<span className={styles.btnText}> Prev</span>
        </button>

        <span className={styles.pageInfo}>
          {currentPage} / {numPages}
        </span>

        <button
          className={styles.toolbarBtn}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= numPages}
          title="Next page (→ key)"
        >
          <span className={styles.btnText}>Next </span>▶
        </button>

        {/* Separator */}
        <div className={styles.separator} />

        {/* Jump to page */}
        <div className={styles.jumpGroup}>
          <label className={styles.jumpLabel}>Go to:</label>
          <input
            type="number"
            min={1}
            max={numPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={handleJumpKeyDown}
            placeholder="#"
            className={styles.jumpInput}
          />
          <button className={styles.jumpBtn} onClick={handleJump} title="Jump to page">
            Go
          </button>
        </div>

        {/* Separator */}
        <div className={styles.separator} />

        {/* Zoom controls */}
        <button
          className={styles.zoomBtn}
          onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
          title="Zoom out (- key)"
        >
          −
        </button>
        <span className={styles.zoomDisplay}>
          {Math.round(scale * 100)}%
        </span>
        <button
          className={styles.zoomBtn}
          onClick={() => setScale(s => Math.min(3, s + 0.2))}
          title="Zoom in (+ key)"
        >
          +
        </button>
        <button
          className={styles.fitBtn}
          onClick={autoFitScale}
          title="Fit to width"
        >
          Fit
        </button>
      </div>

      {/* Main area with page view and dial */}
      <div className={styles.mainArea}>
        {/* Page display area */}
        <div
          className={styles.pageDisplay}
          ref={pageDisplayRef}
          onTouchStart={handleSwipeTouchStart}
          onTouchEnd={handleSwipeTouchEnd}
        >
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
          >
            <div className={styles.pageWrapper}>
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          </Document>

          {/* Keyboard shortcut hint (desktop only, auto-dismisses) */}
          <div className={`${styles.shortcutHint} ${showShortcutHint ? styles.shortcutHintVisible : ''}`}>
            ← → Navigate &nbsp;|&nbsp; + − Zoom &nbsp;|&nbsp; Scroll dial
          </div>
        </div>

        {/* Desktop: Vertical dial bar navigator */}
        {numPages > 1 && (
          <div
            ref={dialRef}
            className={styles.dialVertical}
            onMouseDown={handleDialMouseDown}
            onTouchStart={handleDialTouchStart}
          >
            <div className={styles.dialLabel}>Dial</div>

            {dialTicks.map((pageNum) => {
              const isCurrent = pageNum === currentPage;
              const isValid = pageNum >= 1 && pageNum <= numPages;
              const distance = Math.abs(pageNum - currentPage);

              return (
                <div
                  key={pageNum}
                  className={styles.dialTick}
                  onClick={() => isValid ? goToPage(pageNum) : null}
                  style={{
                    height: isCurrent ? 36 : 28,
                    cursor: isValid ? 'pointer' : 'default',
                  }}
                >
                  <div
                    className={styles.dialTickLine}
                    style={{
                      width: isCurrent ? 28 : Math.max(8, 20 - distance * 4),
                      height: isCurrent ? 3 : 2,
                      background: !isValid
                        ? 'transparent'
                        : isCurrent
                          ? '#3b82f6'
                          : `rgba(148, 163, 184, ${Math.max(0.15, 0.6 - distance * 0.12)})`,
                    }}
                  />
                  {isCurrent && (
                    <div className={styles.dialTickLabel}>{pageNum}</div>
                  )}
                  {isValid && !isCurrent && distance === visibleRange && (
                    <div className={styles.dialTickEdgeLabel}>{pageNum}</div>
                  )}
                </div>
              );
            })}

            <div className={styles.dialScrollHint}>▲▼</div>
          </div>
        )}
      </div>

      {/* Mobile: Horizontal scrubber */}
      {numPages > 1 && (
        <div
          ref={scrubberRef}
          className={styles.scrubberContainer}
          onMouseDown={handleScrubberMouseDown}
          onTouchStart={handleScrubberTouchStart}
        >
          <div className={styles.scrubberTrack}>
            <div className={styles.scrubberTicksRow}>
              {scrubberTicks.map((pageNum) => {
                const isCurrent = pageNum === currentPage;
                const isValid = pageNum >= 1 && pageNum <= numPages;
                const distance = Math.abs(pageNum - currentPage);

                return (
                  <div
                    key={pageNum}
                    className={styles.scrubberTick}
                    onClick={() => isValid ? goToPage(pageNum) : null}
                    style={{ cursor: isValid ? 'pointer' : 'default' }}
                  >
                    <div
                      className={styles.scrubberTickLine}
                      style={{
                        width: isCurrent ? 3 : 2,
                        height: isCurrent ? 24 : Math.max(6, 18 - distance * 3),
                        background: !isValid
                          ? 'transparent'
                          : isCurrent
                            ? '#3b82f6'
                            : `rgba(148, 163, 184, ${Math.max(0.15, 0.6 - distance * 0.1)})`,
                      }}
                    />
                    {(isCurrent || (isValid && distance === scrubberVisibleRange)) && (
                      <div
                        className={styles.scrubberTickNum}
                        style={{
                          color: isCurrent ? '#3b82f6' : '#475569',
                          fontWeight: isCurrent ? 700 : 400,
                          fontSize: isCurrent ? '10px' : '8px',
                        }}
                      >
                        {isValid ? pageNum : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.scrubberInfo}>
            <span className={styles.scrubberPageDisplay}>
              Page <span className={styles.scrubberPageCurrent}>{currentPage}</span> of {numPages}
            </span>
            <span className={styles.scrubberHint}>◀ Drag ▶</span>
          </div>
        </div>
      )}
    </div>
  );
}

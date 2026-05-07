'use client';

import React, { useState } from 'react';
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
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ 
        padding: '10px', 
        background: '#1e293b', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '1rem',
        color: 'white',
        borderBottom: '1px solid #334155'
      }}>
        <span>{numPages} Pages</span>
        
        <div style={{ width: '20px' }}></div>
        
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>Zoom Out</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))}>Zoom In</button>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        background: '#0f172a',
        gap: '2rem'
      }}>
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} style={{ marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
              <Page 
                pageNumber={index + 1} 
                scale={scale} 
                renderTextLayer={false} 
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

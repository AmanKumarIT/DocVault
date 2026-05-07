'use client';

import React, { useState } from 'react';

interface ImageViewerProps {
  url: string;
  name: string;
}

export default function ImageViewer({ url, name }: ImageViewerProps) {
  const [scale, setScale] = useState<number>(1.0);

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
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))}>Zoom Out</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(5, s + 0.2))}>Zoom In</button>
        <button onClick={() => setScale(1)}>Reset</button>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        background: '#0f172a'
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt={name} 
          style={{ 
            transform: `scale(${scale})`, 
            transition: 'transform 0.2s ease',
            transformOrigin: 'center center',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }} 
        />
      </div>
    </div>
  );
}

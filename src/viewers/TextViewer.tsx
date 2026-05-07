'use client';

import React, { useState, useEffect } from 'react';

interface TextViewerProps {
  url: string;
}

export default function TextViewer({ url }: TextViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch text file');
        const text = await response.text();
        setContent(text);
      } catch (err: any) {
        setError(err.message || 'Error loading text file');
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [url]);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '2rem',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: '1.5'
      }}>
        {loading && <div>Loading text content...</div>}
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        {!loading && !error && (
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            background: '#1e293b', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
          }}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

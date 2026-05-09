'use client';

import React, { useState, useEffect } from 'react';
import { Search, UploadCloud, FileBox, LogOut } from 'lucide-react';
import styles from './Dashboard.module.css';
import FileList from './FileList';
import UploadModal from './UploadModal';
import ViewerModal from './ViewerModal';
import { useStore } from '@/store/useStore';
import { fetchDocuments, supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  
  const { documents, setDocuments, removeDocument } = useStore();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data, error } = await fetchDocuments();
    if (data && !error) {
      setDocuments(data);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FileBox className={styles.titleIcon} size={32} />
          DocVault Lite
        </h1>
        
        <div className={styles.actions}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            className={styles.uploadBtn}
            onClick={() => setUploadModalOpen(true)}
          >
            <UploadCloud size={20} />
            <span className={styles.btnLabel}>Upload File</span>
          </button>

          <button 
            className={styles.uploadBtn}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            title="Sign Out"
          >
            <LogOut size={20} />
            <span className={styles.btnLabel}>Sign Out</span>
          </button>
        </div>
      </header>

      <main>
        <FileList documents={filteredDocs} />
      </main>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setUploadModalOpen(false)} 
          onSuccess={loadDocuments} 
        />
      )}
      
      <ViewerModal />
    </div>
  );
}

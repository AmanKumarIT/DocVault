'use client';

import { useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import Auth from '@/components/Auth';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user, isAuthInitialized, setUser, setAuthInitialized } = useStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthInitialized(true);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setAuthInitialized]);

  if (!isAuthInitialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {user ? <Dashboard /> : <Auth />}
    </main>
  );
}


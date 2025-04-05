import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentSession, supabase, signOut as supabaseSignOut } from '../lib/supabase';

// Create the auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for session on initial load
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const { session, error } = await getCurrentSession();
        if (error) throw error;
        setUser(session?.user || null);
      } catch (err) {
        console.error('Error loading auth session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    const { error } = await supabaseSignOut();
    if (error) {
      setError(error.message);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  // Clear any auth errors
  const clearError = () => setError(null);

  // Context value
  const value = {
    user,
    loading,
    error,
    signOut,
    clearError,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

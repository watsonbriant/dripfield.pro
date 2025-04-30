import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  addAttendedShow: (showId: string) => Promise<void>;
  removeAttendedShow: (showId: string) => Promise<void>;
  checkShowAttendance: (showId: string) => Promise<boolean>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getInitialSession();
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };
  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const addAttendedShow = async (showId: string) => {
    if (!user) throw new Error('User must be logged in');
    
    const { error } = await supabase
      .from('user_attended_shows')
      .insert({ user_id: user.id, show_id: showId });
      
    if (error) throw error;
  };
  
  const removeAttendedShow = async (showId: string) => {
    if (!user) throw new Error('User must be logged in');
    
    const { error } = await supabase
      .from('user_attended_shows')
      .delete()
      .eq('user_id', user.id)
      .eq('show_id', showId);
      
    if (error) throw error;
  };
  
  const checkShowAttendance = async (showId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_attended_shows')
      .select('id')
      .eq('user_id', user.id)
      .eq('show_id', showId);
      
    if (error) {
      console.error('Error checking attendance:', error);
      return false;
    }
    
    // If we found at least one record, the user has attended this show
    return data !== null && data.length > 0;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    addAttendedShow,
    removeAttendedShow,
    checkShowAttendance,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
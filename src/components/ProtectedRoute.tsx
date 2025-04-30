import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (user && adminOnly) {
        setIsCheckingAdmin(true);
        try {
          // Query the user_roles table to check admin status
          const { data, error } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(data?.is_admin || false);
          }
        } catch (error) {
          console.error('Error in admin check:', error);
          setIsAdmin(false);
        } finally {
          setIsCheckingAdmin(false);
        }
      }
    }

    checkAdminStatus();
  }, [user, adminOnly]);

  // Show loading spinner while checking auth status or admin status
  if (loading || (adminOnly && isCheckingAdmin)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tertiary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If adminOnly and user is not admin, show forbidden message
  if (adminOnly && !isAdmin) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="mt-8 max-w-md mx-auto bg-[#172330] border border-white/10 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-[#fce7ca]/90">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Render the protected content
  return <>{children}</>;
};
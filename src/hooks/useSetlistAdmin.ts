import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const useSetlistAdmin = (user: any, showId: string | undefined) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [wlHovered, setWlHovered] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }
      
      // Check cache first
      const cacheKey = `admin_status_${user.id}`;
      const cachedStatus = sessionStorage.getItem(cacheKey);
      
      if (cachedStatus !== null) {
        setIsAdmin(cachedStatus === 'true');
        setIsAdminLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsAdminLoading(false);
          return;
        }
        
        const adminStatus = data?.is_admin || false;
        setIsAdmin(adminStatus);
        setIsAdminLoading(false);
        
        // Cache the result for this session
        sessionStorage.setItem(cacheKey, adminStatus.toString());
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
    }
    
    checkAdminStatus();
  }, [user]);

  const handleCopyLink = useCallback(async () => {
    if (!showId) return;
    try {
      await navigator.clipboard.writeText(showId);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [showId]);

  const handleEditShow = useCallback(() => {
    if (!showId) return;
    localStorage.setItem('adminSelectedShowId', showId);
    localStorage.setItem('adminActiveTab', 'Setlist');
    navigate('/admin');
  }, [showId, navigate]);

  const handleWlMouseEnter = useCallback(() => {
    setWlHovered(true);
  }, []);

  const handleWlMouseLeave = useCallback(() => {
    setWlHovered(false);
  }, []);

  return {
    isAdmin,
    isAdminLoading,
    linkCopied,
    wlHovered,
    handleCopyLink,
    handleEditShow,
    handleWlMouseEnter,
    handleWlMouseLeave
  };
};


import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, MapPin, Music, Users, Building2, Disc, X, ShieldCheck, Search, Bug, FileWarning, ListMusic } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  onNavigate?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
  openShowModal?: () => void;
}

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
  action?: () => void;
  badge?: number | null;
  newBadge?: boolean;
}

export function Sidebar({ 
  onNavigate, 
  isOpen = false, 
  onClose, 
  isMobile = false, 
  isAdmin = false,
  openShowModal
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [bugCount, setBugCount] = useState<number | null>(null);

  // Fetch bug count from Supabase
  useEffect(() => {
    if (isAdmin) {
      const fetchBugCount = async () => {
        try {
          const { count, error } = await supabase
            .from('bugs')
            .select('*', { count: 'exact', head: true })
            .eq('bug_completion', false);
          
          if (error) {
            return;
          }
          
          setBugCount(count);
        } catch (error) {
          // Error silently handled
        }
      };
      
      // Initial fetch
      fetchBugCount();

      // Set up a subscription for real-time updates
      const bugSubscription = supabase
        .channel('bug-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'bugs'
        }, () => {
          fetchBugCount();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bugs'
        }, () => {
          fetchBugCount();
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'bugs'
        }, () => {
          fetchBugCount();
        })
        .subscribe();

      // Clean up subscription on unmount
      return () => {
        supabase.removeChannel(bugSubscription);
      };
    }
  }, [isAdmin]);

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate();
    }
    if (onClose) {
      onClose();
    }
    navigate(path);
  };

  // Navigation items including admin-only options
  const navigation: NavItem[] = [
    { name: 'Home', icon: <Home className="w-5 h-5" />, path: '/' },
    { name: 'Years', icon: <Calendar className="w-5 h-5" />, path: '/years' },
    { name: 'Tours', icon: <MapPin className="w-5 h-5" />, path: '/tours' },
    { name: 'Songs', icon: <Music className="w-5 h-5" />, path: '/songs' },
    { name: 'Guests', icon: <Users className="w-5 h-5" />, path: '/guests' },
    { name: 'Venues', icon: <Building2 className="w-5 h-5" />, path: '/venues' },
    { name: 'Discography', icon: <Disc className="w-5 h-5" />, path: '/discography' },
    { 
      name: 'Echo of a Set', 
      icon: <ListMusic className="w-5 h-5" />, 
      path: '/setlistgame',
      newBadge: true
    },
    { name: 'Submit', icon: <FileWarning className="w-5 h-5" />, path: '/submit' },
    // Admin-only items
    { 
      name: 'Admin Panel', 
      icon: <ShieldCheck className="w-5 h-5" />, 
      path: '/admin', 
      adminOnly: true 
    },
    { 
      name: 'Bug Tracker', 
      icon: <Bug className="w-5 h-5" />, 
      path: '/bugs', 
      adminOnly: true,
      badge: bugCount
    },
    { 
      name: 'Find a Show', 
      icon: <Search className="w-5 h-5" />, 
      path: '#', 
      action: openShowModal,
      adminOnly: true
    },
  ];

  // Base sidebar content
  const sidebarContent = (
    <>
      <nav className="flex-1 px-2 overflow-y-auto bg-[#172330]">
        {navigation.map((item) => {
          // Skip admin-only items if user is not admin
          if (item.adminOnly && !isAdmin) return null;
          return (
            <div
              key={item.name}
              className="border-b border-white/5 last:border-b-0"
            >
              <button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    handleNavigation(item.path);
                  }
                }}
                className={`flex items-center px-3 py-2 text-sm font-medium text-[#ffffff]/90 rounded-md hover:bg-white/10 transition-colors ${
                  (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
                } my-1 w-full text-left`}
              >
                <div className="text-[#fce7ca]">{item.icon}</div>
                <span className="ml-3 flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.newBadge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                    New
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>
    </>
  );

  // Simplified rendering approach - don't use nested fixed divs for mobile
  if (isMobile) {
    // For mobile, render directly without the header section
    return (
      <div className="flex flex-col h-full bg-primary border-r border-white/10 w-full">
        {sidebarContent}
      </div>
    );
  }
  
  // For desktop, use the regular container without header
  return (
    <div className="flex flex-col h-full bg-primary border-r border-white/10 overflow-hidden w-full">
      {sidebarContent}
    </div>
  );
}
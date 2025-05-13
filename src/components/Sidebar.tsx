import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, MapPin, Music, Users, Building2, Disc, X, ShieldCheck, Search, Bug, FileWarning, ListMusic } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Import custom navigation icons
import navYears from '../img/Nav_Years.png';
import navTours from '../img/Nav_Tours.png';
import navSongs from '../img/Nav_Songs.png';
import navGuests from '../img/Nav_Guests.png';
import navVenues from '../img/Nav_Venues.png';
import navDiscography from '../img/Nav_Discography.png';
import navEcho from '../img/Nav_Echo.png';
import navSubmit from '../img/Nav_Submit.png';
import navAdmin from '../img/Nav_Admin.png';
import navBug from '../img/Nav_Bug.png';
import navFindShow from '../img/Nav_FindShow.png';

interface SidebarProps {
  onNavigate?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
  openShowModal?: () => void;
  showAllOnSameLine?: boolean;
}

interface NavItem {
  name: string;
  icon: React.ReactNode;
  desktopIcon?: React.ReactNode;
  path: string;
  adminOnly?: boolean;
  mobileOnly?: boolean;
  action?: () => void;
  badge?: number | null;
  newBadge?: boolean;
}

export function Sidebar({ 
  onNavigate, 
  isOpen = false, 
  onClose, 
  isMobile = true, 
  isAdmin = false,
  openShowModal,
  showAllOnSameLine = false
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [bugCount, setBugCount] = useState<number | null>(null);
  const [sparkle, setSparkle] = useState({ show: false, x: 0, y: 0, itemId: '' });
  const sparkleTimeoutRef = useRef<number | null>(null);

  // Function to handle click and trigger sparkle
  const handleItemClick = (e: React.MouseEvent, item: NavItem) => {
    // Get click position relative to the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Show sparkle with item name
    setSparkle({ show: true, x, y, itemId: item.name });
    
    // Hide sparkle after animation completes
    if (sparkleTimeoutRef.current) {
      window.clearTimeout(sparkleTimeoutRef.current);
    }
    
    sparkleTimeoutRef.current = window.setTimeout(() => {
      setSparkle({ show: false, x: 0, y: 0, itemId: '' });
    }, 500); // Animation duration
    
    // Execute the original click action
    if (item.action) {
      item.action();
    } else {
      handleNavigation(item.path);
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
    };
  }, []);

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
    { name: 'Home', icon: <Home className="w-5 h-5" />, path: '/', mobileOnly: true },
    { 
      name: 'Years', 
      icon: <Calendar className="w-5 h-5" />, 
      desktopIcon: <img src={navYears} alt="Years" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/years' 
    },
    { 
      name: 'Tours', 
      icon: <MapPin className="w-5 h-5" />, 
      desktopIcon: <img src={navTours} alt="Tours" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/tours' 
    },
    { 
      name: 'Songs', 
      icon: <Music className="w-5 h-5" />, 
      desktopIcon: <img src={navSongs} alt="Songs" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/songs' 
    },
    { 
      name: 'Guests', 
      icon: <Users className="w-5 h-5" />, 
      desktopIcon: <img src={navGuests} alt="Guests" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/guests' 
    },
    { 
      name: 'Venues', 
      icon: <Building2 className="w-5 h-5" />, 
      desktopIcon: <img src={navVenues} alt="Venues" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/venues' 
    },
    { 
      name: 'Discography', 
      icon: <Disc className="w-5 h-5" />, 
      desktopIcon: <img src={navDiscography} alt="Discography" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/discography' 
    },
    { 
      name: 'Echo of a Show', 
      icon: <ListMusic className="w-5 h-5" />, 
      desktopIcon: <img src={navEcho} alt="Echo of a Show" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/setlistgame'
    },
    { 
      name: 'Submit', 
      icon: <FileWarning className="w-5 h-5" />, 
      desktopIcon: <img src={navSubmit} alt="Submit" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/submit' 
    },
    // Admin-only items
    { 
      name: 'Admin Panel', 
      icon: <ShieldCheck className="w-5 h-5" />, 
      desktopIcon: <img src={navAdmin} alt="Admin Panel" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/admin', 
      adminOnly: true 
    },
    { 
      name: 'Bug Tracker', 
      icon: <Bug className="w-5 h-5" />, 
      desktopIcon: <img src={navBug} alt="Bug Tracker" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '/bugs', 
      adminOnly: true,
      badge: bugCount
    },
    { 
      name: 'Find a Show', 
      icon: <Search className="w-5 h-5" />, 
      desktopIcon: <img src={navFindShow} alt="Find a Show" className="h-7 w-auto transition-all duration-300 hover:drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]" />,
      path: '#', 
      action: openShowModal,
      adminOnly: true
    },
  ];

  // Filter navigation items based on admin status and view mode
  const filteredNavigation = navigation.filter(item => 
    ((!item.adminOnly || isAdmin) && (!item.mobileOnly || isMobile))
  );

  // For mobile: vertical sidebar
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-primary border-r border-white/10 w-full">
        <nav className="flex-1 px-2 overflow-y-auto bg-[#172330]">
          {filteredNavigation.map((item) => (
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
                <div className="text-[#b27139]">{item.icon}</div>
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
          ))}
        </nav>
      </div>
    );
  }
  
  // For desktop: horizontal navigation
  // Separate regular and admin navigation items
  const regularNavItems = filteredNavigation.filter(item => !item.adminOnly && !item.mobileOnly);
  const adminNavItems = filteredNavigation.filter(item => item.adminOnly && !item.mobileOnly);

  // Find the index of "Echo of a Show" in regularNavItems
  const echoIndex = regularNavItems.findIndex(item => item.name === 'Echo of a Show');

  // Split regularNavItems into two arrays
  const firstLineItems = regularNavItems.slice(0, echoIndex);
  const secondLineItems = regularNavItems.slice(echoIndex);

  // Combine second line items with admin items if showAllOnSameLine is true
  const adminLineItems = showAllOnSameLine 
    ? [...secondLineItems, ...adminNavItems]
    : secondLineItems;

  return (
    <div className="w-full bg-primary">
      <nav className="max-w-screen-2xl mx-auto px-4 py-1">
        {/* First line navigation items */}
        <ul className="flex flex-wrap items-center justify-center">
          {firstLineItems.map((item) => (
            <li key={item.name} className="relative">
              <button
                onClick={(e) => handleItemClick(e, item)}
                className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-1 ${
                  (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
                }`}
                aria-label={item.name}
              >
                {item.desktopIcon || item.icon}
                
                {/* Sparkle effect */}
                {sparkle.show && sparkle.itemId === item.name && (
                  <img 
                    src="/src/img/sparkle.png"
                    alt=""
                    className="sparkle"
                    style={{
                      left: `${sparkle.x - 10}px`,
                      top: `${sparkle.y - 10}px`,
                    }}
                  />
                )}
                
                {/* Badges */}
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.newBadge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                    New
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        
        {/* Second line with Echo of a Show and subsequent items */}
        <div className="border-white/10"></div>
        <ul className="flex flex-wrap items-center justify-center mt-1">
          {adminLineItems.map((item) => (
            <li key={item.name} className="relative">
              <button
                onClick={(e) => handleItemClick(e, item)}
                className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-1 ${
                  (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
                }`}
                aria-label={item.name}
              >
                {item.desktopIcon || item.icon}
                
                {/* Sparkle effect */}
                {sparkle.show && sparkle.itemId === item.name && (
                  <img 
                    src="/src/img/sparkle.png"
                    alt=""
                    className="sparkle"
                    style={{
                      left: `${sparkle.x - 10}px`,
                      top: `${sparkle.y - 10}px`,
                    }}
                  />
                )}
                
                {/* Badges */}
                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.newBadge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                    New
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        
        {/* Admin section if not showing all on same line */}
        {!showAllOnSameLine && adminNavItems.length > 0 && (
          <>
            <div className="border-white/10"></div>
            <ul className="flex flex-wrap items-center justify-center mt-1">
              {adminNavItems.map((item) => (
                <li key={item.name} className="relative">
                  <button
                    onClick={(e) => handleItemClick(e, item)}
                    className={`flex items-center rounded-md hover:bg-white/10 transition-colors px-1 ${
                      (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
                    }`}
                    aria-label={item.name}
                  >
                    {item.desktopIcon || item.icon}
                    
                    {/* Sparkle effect */}
                    {sparkle.show && sparkle.itemId === item.name && (
                      <img 
                        src="/src/img/sparkle.png"
                        alt=""
                        className="sparkle"
                        style={{
                          left: `${sparkle.x - 10}px`,
                          top: `${sparkle.y - 10}px`,
                        }}
                      />
                    )}
                    
                    {/* Badges */}
                    {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
    </div>
  );
}
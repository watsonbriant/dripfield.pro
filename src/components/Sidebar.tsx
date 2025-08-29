import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, MapPin, Music, Users, Building2, Disc, X, ShieldCheck, Search, Bug, FileWarning, ListMusic, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Import custom navigation icons
import sparklePic from '../img/sparkle.png'

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
    { 
      name: 'Home', 
      icon: <Home className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Home</span>
        </div>
      ),
      path: '/',
      mobileOnly: true 
    },
    { 
      name: 'Years', 
      icon: <Calendar className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Years</span>
        </div>
      ),
      path: '/years' 
    },
    { 
      name: 'Tours', 
      icon: <MapPin className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Tours</span>
        </div>
      ),
      path: '/tours' 
    },
    { 
      name: 'Songs', 
      icon: <Music className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Music className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Songs</span>
        </div>
      ),
      path: '/songs' 
    },
    { 
      name: 'Guests', 
      icon: <Users className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Guests</span>
        </div>
      ),
      path: '/guests' 
    },
    { 
      name: 'Venues', 
      icon: <Building2 className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Venues</span>
        </div>
      ),
      path: '/venues' 
    },
    { 
      name: 'Discography', 
      icon: <Disc className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Disc className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Discography</span>
        </div>
      ),
      path: '/discography' 
    },
    { 
      name: 'Echo of a Show', 
      icon: <ListMusic className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <ListMusic className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Echo of a Show</span>
        </div>
      ),
      path: '/setlistgame'
    },
    { 
      name: 'Jam of the Year', 
      icon: <Trophy className="w-5 h-5" />,
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Trophy className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Jam of the Year</span>
        </div>
      ),
      path: '/joty'
    },
    { 
      name: 'Submit', 
      icon: <FileWarning className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <FileWarning className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Submit</span>
        </div>
      ),
      path: '/submit' 
    },
    // Admin-only items
    { 
      name: 'Admin Panel', 
      icon: <ShieldCheck className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Admin Panel</span>
        </div>
      ),
      path: '/admin', 
      adminOnly: true 
    },
    { 
      name: 'Bug Tracker', 
      icon: <Bug className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Bug className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Bug Tracker</span>
        </div>
      ),
      path: '/bugs', 
      adminOnly: true,
      badge: bugCount
    },
    { 
      name: 'Find', 
      icon: <Search className="w-5 h-5" />, 
      desktopIcon: (
        <div className="flex items-center gap-1 px-2 py-1 bg-primary text-[#272727] rounded-lg border border-[#272727] transition-all duration-300 hover:bg-[#272727] hover:border-primary hover:text-primary hover:drop-shadow-[3px_3px_0px_rgba(39,39,39,1)]">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="font-trad text-[1.125rem] leading-[1rem] tracking-tight mb-0.5">Find</span>
        </div>
      ),
      path: '#', 
      action: openShowModal,
      adminOnly: true
    },
    { 
      name: 'Donate', 
      icon: null,
      path: '#',
      action: () => window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank'),
      mobileOnly: true 
    },
  ];

  // Filter navigation items based on admin status and view mode
  const filteredNavigation = navigation.filter(item => 
    ((!item.adminOnly || isAdmin) && (!item.mobileOnly || isMobile))
  );

  // For mobile: vertical sidebar
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-primary border-r border-tertiary/10 w-full">
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <div
              key={item.name}
              className="border-b border-white/5 last:border-b-0"
            >
              {item.name === 'Donate' ? (
                <button
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    }
                  }}
                  className="mx-auto block px-3 pb-0.5 my-4 text-lg font-trad text-black bg-secondary hover:bg-secondary/70 rounded-full transition-colors border border-black"
                  aria-label={item.name}
                >
                  {item.name}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`flex items-center px-3 rounded-md hover:bg-white/10 transition-colors ${
                    (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'bg-white/10' : ''
                  } my-1 w-full relative`}
                  aria-label={item.name}
                >
                  <div className="relative">
                    {/* Use desktop icon (image) if available, fallback to icon */}
                    {item.desktopIcon || (
                      <div className="text-[#b27139]">{item.icon}</div>
                    )}
                    
                    {/* Badges positioned relative to the icon */}
                    {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {item.newBadge && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-md bg-tertiary text-white">
                        New
                      </span>
                    )}
                  </div>
                </button>
              )}
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
                    src={sparklePic}
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
        <ul className="flex flex-wrap items-center justify-center mt-1.5">
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
                    src={sparklePic}
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
                        src={sparklePic}
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
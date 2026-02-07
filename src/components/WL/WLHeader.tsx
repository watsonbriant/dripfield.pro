import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, ChevronDown, BoomBox, MessageSquare, ListMusic, CircleHelp, Link as LinkIcon, Menu, X } from 'lucide-react';
import sparklePic from '../../img/sparkle.png';
import wlCommunityLogo from '../../img/wl/wl-community-logo.png';

export function WLHeader() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [sparkle, setSparkle] = useState({ show: false, x: 0, y: 0 });
  const sparkleTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
    };
  }, []);

  // Fetch username when user is available
  useEffect(() => {
    async function fetchUsername() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching username:', error);
          return;
        }
        
        if (data?.username) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Error in username fetch:', error);
      }
    }
    
    fetchUsername();
  }, [user]);

  const handleButtonClick = (e: React.MouseEvent) => {
    // Only show sparkle on non-mobile
    if (!isMobile) {
      // Get click position relative to the button
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Show sparkle
      setSparkle({ show: true, x, y });
      
      // Hide sparkle after animation completes
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
      
      sparkleTimeoutRef.current = window.setTimeout(() => {
        setSparkle({ show: false, x: 0, y: 0 });
      }, 500); // Animation duration
    }

    // Toggle menu
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Display initial of email if no username is available
  const displayText = username || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <>
      {/* Overlay for mobile menu */}
      {isNavMenuOpen && isMobile && (
        <div
          className="fixed bg-black/50 backdrop-blur-sm z-[100] lg:hidden"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setIsNavMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu - slides in from left */}
      <div className={`${
        isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:hidden fixed w-64 h-full top-0 z-[30000] transition-transform duration-300 ease-in-out bg-canvas border-r border-fourth`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-fourth">
            <h2 className="text-lg font-semibold text-fifth">Menu</h2>
            <button
              onClick={() => setIsNavMenuOpen(false)}
              className="p-1 rounded-md hover:bg-tertiary/20 transition-colors"
            >
              <X className="w-6 h-6 text-fifth" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <button
              className="w-full text-left px-3 py-3 hover:bg-tertiary/20 hover:underline transition-colors flex items-center gap-3 border-b border-fourth/30 last:border-b-0 rounded-md"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <BoomBox className="w-5 h-5 flex-shrink-0 text-fifth" />
              <span className="text-sm font-medium text-fifth">WTED Goose Radio</span>
            </button>
            <button
              className="w-full text-left px-3 py-3 hover:bg-tertiary/20 hover:underline transition-colors flex items-center gap-3 border-b border-fourth/30 last:border-b-0 rounded-md"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0 text-fifth" />
              <span className="text-sm font-medium text-fifth">Community Forum</span>
            </button>
            <button
              className="w-full text-left px-3 py-3 hover:bg-tertiary/20 hover:underline transition-colors flex items-center gap-3 border-b border-fourth/30 last:border-b-0 rounded-md"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <ListMusic className="w-5 h-5 flex-shrink-0 text-fifth" />
              <span className="text-sm font-medium text-fifth">Setlist Archive</span>
            </button>
            <button
              className="w-full text-left px-3 py-3 hover:bg-tertiary/20 hover:underline transition-colors flex items-center gap-3 border-b border-fourth/30 last:border-b-0 rounded-md"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <CircleHelp className="w-5 h-5 flex-shrink-0 text-fifth" />
              <span className="text-sm font-medium text-fifth">Goose 101</span>
            </button>
            <button
              className="w-full text-left px-3 py-3 hover:bg-tertiary/20 hover:underline transition-colors flex items-center gap-3 rounded-md"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <LinkIcon className="w-5 h-5 flex-shrink-0 text-fifth" />
              <span className="text-sm font-medium text-fifth">Links</span>
            </button>
          </nav>
        </div>
      </div>

      <header className="bg-wl-green border-b border-fourth shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Mobile: Hamburger on left, Desktop: Logo on left */}
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                className="lg:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-wl-dark-green text-wl-white font-medium hover:bg-wl-dark-grey transition-colors focus:outline-none border border-fourth"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Logo/Title Section - Hidden on mobile, shown on desktop */}
              <Link
                to="/wl"
                className="hidden lg:flex items-center gap-2 text-lg font-semibold leading-tight text-fifth hover:text-tertiary transition-colors"
              >
                <img 
                  src={wlCommunityLogo} 
                  alt="Wysteria Lane Community Logo" 
                  className="h-8 w-auto"
                />
                Wysteria Lane
              </Link>
            </div>

            {/* Mobile: Centered Logo/Title */}
            <div className="lg:hidden flex-1 flex justify-center">
              <Link
                to="/wl"
                className="flex items-center gap-2 text-lg font-semibold leading-tight text-fifth hover:text-tertiary transition-colors"
              >
                <img 
                  src={wlCommunityLogo} 
                  alt="Wysteria Lane Community Logo" 
                  className="h-8 w-auto"
                />
                Wysteria Lane
              </Link>
            </div>

            {/* Center Navigation Buttons - Desktop Only */}
            <div className="hidden lg:flex items-center gap-2">
              <button className="flex items-center gap-1 px-1 py-0.5 bg-wl-light-orange text-wl-black rounded-lg border border-wl-black transition-all duration-300 hover:bg-wl-orange hover:drop-shadow-[3px_3px_0px_rgba(31,31,31,1)]">
                <BoomBox className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">WTED Goose Radio</span>
              </button>
              <button className="flex items-center gap-1 px-1 py-0.5 bg-wl-light-orange text-wl-black rounded-lg border border-wl-black transition-all duration-300 hover:bg-wl-orange hover:drop-shadow-[3px_3px_0px_rgba(31,31,31,1)]">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">Community Forum</span>
              </button>
              <button className="flex items-center gap-1 px-1 py-0.5 bg-wl-light-orange text-wl-black rounded-lg border border-wl-black transition-all duration-300 hover:bg-wl-orange hover:drop-shadow-[3px_3px_0px_rgba(31,31,31,1)]">
                <ListMusic className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">Setlist Archive</span>
              </button>
              <button className="flex items-center gap-1 px-1 py-0.5 bg-wl-light-orange text-wl-black rounded-lg border border-wl-black transition-all duration-300 hover:bg-wl-orange hover:drop-shadow-[3px_3px_0px_rgba(31,31,31,1)]">
                <CircleHelp className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">Goose 101</span>
              </button>
              <button className="flex items-center gap-1 px-1 py-0.5 bg-wl-light-orange text-wl-black rounded-lg border border-wl-black transition-all duration-300 hover:bg-wl-orange hover:drop-shadow-[3px_3px_0px_rgba(31,31,31,1)]">
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm">Links</span>
              </button>
            </div>

            {/* Right Side - User Menu & Actions */}
            <div className="flex items-center">
            {!user ? (
              <>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-wl-dark-green text-wl-white font-medium hover:bg-wl-dark-grey hover:text-white transition-colors focus:outline-none border border-fourth"
                  onClick={(e) => {
                    // Only show sparkle on non-mobile
                    if (!isMobile) {
                      // Get click position relative to the button
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top; 
                      
                      // Show sparkle
                      setSparkle({ show: true, x, y });
                      
                      // Hide sparkle after animation completes
                      if (sparkleTimeoutRef.current) {
                        window.clearTimeout(sparkleTimeoutRef.current);
                      }
                      
                      sparkleTimeoutRef.current = window.setTimeout(() => {
                        setSparkle({ show: false, x: 0, y: 0 });
                      }, 500); // Animation duration
                    }
                  }} 
                >
                  Sign In
                  {sparkle.show && !isMobile && (
                    <img 
                      src={sparklePic}
                      alt=""
                      className="sparkle absolute pointer-events-none"
                      style={{
                        left: `${sparkle.x - 10}px`,
                        top: `${sparkle.y - 10}px`,
                      }}
                    />
                  )}
                </Link>
              </>
            ) : (
              <>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-wl-dark-green text-wl-white font-medium hover:bg-wl-dark-grey hover:text-white transition-colors focus:outline-none border border-fourth"
                    onClick={handleButtonClick}
                  >
                    {/* Show User icon on mobile, username on desktop */}
                    <span className="lg:hidden">
                      <User className="w-5 h-5" />
                    </span>
                    <span className="hidden lg:inline text-sm">
                      {displayText}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                    
                    {/* Sparkle effect - only on desktop */}
                    {sparkle.show && !isMobile && (
                      <img 
                        src={sparklePic}
                        alt=""
                        className="sparkle absolute pointer-events-none"
                        style={{
                          left: `${sparkle.x - 10}px`,
                          top: `${sparkle.y - 10}px`,
                        }}
                      />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="absolute right-0 mt-2 bg-canvas border border-fourth rounded-lg shadow-lg z-50 overflow-y-auto w-24 font-medium">
                      <button
                        className="w-full text-left px-2 py-0.5 text-[0.625rem] hover:bg-tertiary hover:underline transition-colors block"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}


import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, ChevronDown } from 'lucide-react';
import sparklePic from '../../img/sparkle.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

export function WLHeader() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [sparkle, setSparkle] = useState({ show: false, x: 0, y: 0 });
  const sparkleTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
    <header className="bg-canvas border-b border-fourth shadow-xl">
      <div className="max-w-[1500px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo/Title Section */}
          <div className="flex items-center gap-4">
            <Link
              to="/wl"
              className="text-lg font-bold text-fifth hover:text-tertiary transition-colors"
            >
              WL - New Site Design
            </Link>
          </div>

          {/* Right Side - User Menu & Actions */}
          <div className="flex items-center">
            {!user ? (
              <>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank');
                  }}
                  className="relative px-1.5 py-0.5 text-sm font-medium text-white bg-fourth hover:bg-tertiary hover:text-fifth rounded-lg transition-colors border border-fourth mr-2 hidden md:block"
                >
                  Donate
                </Link>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-tertiary text-fourth font-medium hover:bg-fourth hover:text-white transition-colors focus:outline-none border border-fourth"
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
                <a
                  href="https://x.com/dripfieldpro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-2 text-white hover:border border border-fifth hidden md:block hover:border-fourth rounded-lg px-1 hover:text-white hover:bg-fourth bg-fifth transition-colors transition-all duration-300 hover:drop-shadow-[2px_2px_0px_rgba(244,155,29,1)]"
                >
                  <FontAwesomeIcon
                    icon={faXTwitter}
                    size="1x"
                  />
                </a>

                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank');
                  }}
                  className={`relative px-1.5 py-0.5 text-sm font-medium text-fifth bg-fourth text-white hover:bg-tertiary hover:text-fifth rounded-lg transition-colors border border-fifth mr-2 hidden md:block`}
                >
                  Donate
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-tertiary text-fourth font-medium hover:bg-fourth hover:text-white transition-colors focus:outline-none border border-fourth"
                    onClick={handleButtonClick}
                  >
                    {/* Show User icon on mobile, username on desktop */}
                    <span className="md:hidden">
                      <User className="w-5 h-5" />
                    </span>
                    <span className="hidden md:inline text-sm">
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
                      <Link
                        to="/profile"
                        className="w-full text-left px-2 py-0.5 text-[0.625rem] hover:bg-tertiary hover:underline transition-colors block"
                        onClick={() => setIsOpen(false)}
                      >
                        My Stats
                      </Link>
                      <Link
                        to="/settings"
                        className="w-full text-left px-2 py-0.5 text-[0.625rem] hover:bg-tertiary hover:underline transition-colors block"
                        onClick={() => setIsOpen(false)}
                      >
                        Settings
                      </Link>
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
  );
}


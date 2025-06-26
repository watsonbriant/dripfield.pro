import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, ChevronDown } from 'lucide-react';
import sparklePic from '../img/sparkle.png'

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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
    navigate('/login');
  };

  // Display initial of email if no username is available
  const displayText = username || (user?.email ? user.email.split('@')[0] : 'User');

  if (!user) {
    return (
      <div className="flex items-center">
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank');
          }}
          className={`relative px-3 pt-1 pb-0.5 text-sm font-mohr text-black bg-secondary hover:bg-secondary/70 rounded-full transition-colors border border-black mr-2 hidden md:block`}
        >
          Donate
        </Link>
        <Link
          to="/login"
          className={`relative px-3 pt-1 pb-0.5 ${isMobile ? 'text-sm' : 'text-lg'} font-mohr text-black bg-[#f9ae37] hover:bg-tertiary/80 rounded-full transition-colors border border-black`}
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
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Link
        to="#"
        onClick={(e) => {
          e.preventDefault();
          window.open('https://www.paypal.com/donate/?hosted_button_id=RGT26R3CG44YJ', '_blank');
        }}
        className={`relative px-3 pt-1 pb-0.5 text-sm font-mohr text-black bg-secondary hover:bg-secondary/70 rounded-full transition-colors border border-black mr-2 hidden md:block`}
      >
        Donate
      </Link>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="mt-0.5 relative inline-flex items-center gap-1 px-3 pt-1 pb-0.5 rounded-full bg-[#f9ae37] text-black font-mohr hover:bg-tertiary/80 transition-colors focus:outline-none border border-black"
          onClick={handleButtonClick}
        >
          {/* Show User icon on mobile, username on desktop */}
          <span className="md:hidden">
            <User className="w-5 h-5" />
          </span>
          <span className="hidden md:inline text-lg truncate max-w-[120px]">
            Profile
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
          <div className="absolute right-0 mt-2 bg-[#fce7ca] border border-black rounded-lg shadow-lg z-50 overflow-y-auto w-48 font-mohr">
            <div className="w-full text-left px-4 py-1 text-base leading-tight bg-[#f9ae37] font-sans font-normal border-b border-black">
              Welcome, <span className="font-bold">{username || displayText}</span>!
            </div>
            <Link
              to="/profile"
              className="w-full text-left px-4 pt-1 pb-0.5 text-base hover:bg-surface-secondary hover:underline transition-colors block"
              onClick={() => setIsOpen(false)}
            >
              My Stats
            </Link>
            <Link
              to="/settings"
              className="w-full text-left px-4 py-0.5 text-base hover:bg-surface-secondary hover:underline transition-colors block"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <button
              className="w-full text-left px-4 pt-0.5 pb-1 text-base hover:bg-surface-secondary hover:underline transition-colors"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, ChevronDown } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/login');
  };

  // Display initial of email if no username is available
  const displayText = username || (user?.email ? user.email.split('@')[0] : 'User');

  if (!user) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 text-sm font-medium text-white bg-tertiary hover:bg-tertiary/80 rounded-lg transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary text-white font-semibold hover:bg-tertiary/80 transition-colors focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Show User icon on mobile, username on desktop */}
        <span className="md:hidden">
          <User className="w-5 h-5" />
        </span>
        <span className="hidden md:inline text-sm truncate max-w-[120px]">
          {displayText}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 overflow-y-auto w-48 font-semibold">
          <Link
            to="/profile"
            className="w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors block"
            onClick={() => setIsOpen(false)}
          >
            My Stats
          </Link>
          <Link
            to="/settings"
            className="w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors block"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <button
            className="w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
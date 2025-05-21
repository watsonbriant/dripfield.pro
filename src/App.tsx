import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { Years } from './components/Years';
import { Tours } from './components/Tours';
import { Songs } from './components/Songs';
import { Guests } from './components/Guests';
import { Venues } from './components/Venues';
import { Setlist } from './components/Setlist';
import { Guest } from './components/Guest';
import { Discography } from './components/Discography';
import { Venue } from './components/Venue';
import { Admin } from './components/Admin';
import { Bugs } from './components/Bugs';
import { Song } from './components/Song';
import { SetlistGame } from './components/SetlistGame';
import { TourDetailsPage } from './components/TourDetailsPage'; // Add this import
import { Menu, X } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ResetPassword } from './components/ResetPassword';
import { Profile } from './components/Profile';
import { PublicProfile } from './components/PublicProfile';
import { Settings } from './components/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserMenu } from './components/UserMenu';
import { Submit } from './components/Submit';
import { SetlistGameShowPage } from './components/SetlistGameShowPage';
import sparklePic from './img/sparkle.png'

import logo from './img/Logo_Text.png';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [showId, setShowId] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Add sparkle state
  const [logoSparkle, setLogoSparkle] = useState({ show: false, x: 0, y: 0 });
  const sparkleTimeoutRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add this useEffect to detect mobile screens
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
    };
  }, []);

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
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
          return;
        }
        
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      }
    }
    
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    async function fetchUsername() {
      if (!user) {
        setUsername(null);
        return;
      }
      
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

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    // Only show sparkle on non-mobile
    if (!isMobile) {
      // Get click position relative to the button
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Show sparkle
      setLogoSparkle({ show: true, x, y });
      
      // Hide sparkle after animation completes
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
      
      sparkleTimeoutRef.current = window.setTimeout(() => {
        setLogoSparkle({ show: false, x: 0, y: 0 });
      }, 500); // Animation duration
    }
  
    navigate('/');
  };

  const handleShowSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (showId.trim()) {
      navigate(`/setlist/${showId.trim()}`);
      setShowId('');
      setIsShowModalOpen(false);
    }
  };

  // Function to be passed to Sidebar component to open the modal
  const openShowModal = () => {
    setIsShowModalOpen(true);
  };

  return (
    <div className="flex flex-col md:h-screen bg-canvas">
      {/* Header with integrated navigation - Only shown on desktop */}
      <div className="hidden lg:block">
        <header className="z-20 bg-primary border-b border-black/15 px-6 py-1 md:sticky md:top-0">
          <div className="flex items-center max-w-[1280px] mx-auto w-full">
          <button
            onClick={handleLogoClick}
            className="focus:outline-none mr-4 relative"
          >
            <img 
              src={logo} 
              alt="Dripfield.pro Logo" 
              className="h-12 w-auto"
            />
            {/* Sparkle effect for logo - only on desktop */}
            {logoSparkle.show && !isMobile && (
              <img 
                src={sparklePic}
                alt=""
                className="sparkle absolute pointer-events-none"
                style={{
                  left: `${logoSparkle.x - 10}px`,
                  top: `${logoSparkle.y - 10}px`,
                }}
              />
            )}
          </button>
            <div className="flex-1 flex justify-center">
              <Sidebar 
                onNavigate={() => setIsSidebarOpen(false)}
                openShowModal={openShowModal}
                isAdmin={isAdmin}
                isOpen={true}
                onClose={() => {}}
                isMobile={false}
                showAllOnSameLine={true} // New prop to control layout
              />
            </div>
            <div className="ml-4">
              <UserMenu />
            </div>
          </div>
        </header>
      </div>

      {/* Content container */}
      <div className="flex-1 flex md:overflow-hidden">
        {/* Overlay - make sure it's behind the sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar - ensure it's above the overlay */}
        <div className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden fixed w-64 h-[calc(100%)] top-[50px] z-30 transition-transform duration-300 ease-in-out`}>
          <Sidebar 
            onNavigate={() => setIsSidebarOpen(false)} 
            openShowModal={openShowModal}
            isAdmin={isAdmin}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={true}
          />
        </div>

        {/* Main content wrapper */}
        <div className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-auto">
          {/* Mobile-only header */}
          <header className="z-20 bg-primary border-b border-white/10 p-4 lg:hidden">
            <div className="relative flex items-center justify-center max-w-[1280px] mx-auto w-full">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute left-0 p-2 rounded-md bg-[#f9ae37] hover:bg-tertiary text-black transition-colors border border-black"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogoClick}
                className="focus:outline-none relative"
              >
                <img 
                  src={logo} 
                  alt="Dripfield.pro Logo" 
                  className="h-8 w-auto"
                />
                {/* No sparkle effect on mobile */}
              </button>
              <div className="absolute right-0">
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-8 w-full">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/years/:year?" element={<Years />} />
              <Route path="/tours/:tour?" element={<Tours />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/guest/:guestId" element={<Guest />} />
              <Route path="/venue/:venueId" element={<Venue />} />
              <Route path="/setlist/:showId" element={<Setlist />} />
              <Route path="/song/:songId" element={<Song />} />
              <Route path="/user/:userId" element={<PublicProfile />} />
              <Route path="/discography" element={<Discography />} />
              <Route path="/submit" element={<Submit />} />
              
              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/bugs" element={
                <ProtectedRoute adminOnly>
                  <Bugs />
                </ProtectedRoute>
              } />
              <Route path="/setlistgame" element={<SetlistGame />} />
              <Route path="/setlistgame/tour/:tourName" element={<TourDetailsPage />} />
              <Route path="/setlistgame/:showId" element={<SetlistGameShowPage />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Find a Show Modal - Positioned at the root level */}
      {isShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsShowModalOpen(false)}></div>
          <div className="relative bg-primary border border-black rounded-lg p-4 w-full max-w-md mx-4">
            <button
              onClick={() => setIsShowModalOpen(false)}
              className="absolute top-4 right-4 rounded-md text-black hover:text-[#a9682e] focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-4">Find a Show</h2>
            <form onSubmit={handleShowSearch} className="space-y-4">
              <div>
                <label htmlFor="showId" className="block text-sm font-semibold text-black mb-1">
                  Enter Show ID
                </label>
                <input
                  type="text"
                  id="showId"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-black rounded-md text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-[#a9682e]"
                  placeholder="Enter Show ID"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#f9ae37] hover:bg-[#e29d26] text-black font-medium rounded-md transition-colors border border-black"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;
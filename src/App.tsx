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
import { Lists } from './components/Lists';
import { ListInd } from './components/ListInd';
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
import { UpdatePassword } from './components/UpdatePassword';
import { Profile } from './components/Profile';
import { PublicProfile } from './components/PublicProfile';
import { Settings } from './components/Settings';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserMenu } from './components/UserMenu';
import { Submit } from './components/Submit';
import { SetlistGameShowPage } from './components/SetlistGameShowPage';
import { Joty } from './components/Joty';
import sparklePic from './img/sparkle.png';
import bgTile from './img/bg_tile.jpg';

import logo from './img/Logo7_Header.jpg';
import logo2 from './img/Logo4_Text.jpg';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [showId, setShowId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
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

  // In App.tsx, modify the checkAdminStatus effect:
  const previousUserIdRef = useRef<string | undefined>();
  const previousIsAdminRef = useRef<boolean | undefined>();

  useEffect(() => {
    // Only run if user ID actually changed
    const currentUserId = user?.id;
    if (previousUserIdRef.current === currentUserId) {
      return; // Skip if user ID hasn't changed
    }
    
    previousUserIdRef.current = currentUserId;
    
    async function checkAdminStatus() {
      if (!user) {
        if (previousIsAdminRef.current !== false) {
          previousIsAdminRef.current = false;
          setIsAdmin(false);
        }
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
          if (previousIsAdminRef.current !== false) {
            previousIsAdminRef.current = false;
            setIsAdmin(false);
          }
          return;
        }
        
        const newIsAdmin = data?.is_admin || false;
        if (previousIsAdminRef.current !== newIsAdmin) {
          previousIsAdminRef.current = newIsAdmin;
          setIsAdmin(newIsAdmin);
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        if (previousIsAdminRef.current !== false) {
          previousIsAdminRef.current = false;
          setIsAdmin(false);
        }
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

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      navigate(`/user/${userId.trim()}`);
      setUserId('');
      setIsShowModalOpen(false);
    }
  };

  // Function to be passed to Sidebar component to open the modal
  const openShowModal = () => {
    setIsShowModalOpen(true);
  };

  return (
    <div 
      className="flex flex-col min-h-screen lg:min-w-[1500px] min-w-0 max-w-full overflow-x-hidden"
    >
      {/* Header with integrated navigation - Only shown on desktop */}
      <div className="hidden lg:block">
        <header className="z-20 bg-canvas border-b border-fourth md:sticky md:top-0 shadow-xl">
          <Sidebar 
            onNavigate={() => setIsSidebarOpen(false)}
            openShowModal={openShowModal}
            isAdmin={isAdmin}
            onClose={() => {}}
            isMobile={false}
            showAllOnSameLine={true}
            logoElement={
              <button
                onClick={handleLogoClick}
                className="focus:outline-none relative iris-effect rounded-lg p-0 h-12 leading-none block"
              >
                <img 
                  src={logo} 
                  alt="Dripfield.pro Logo" 
                  className="h-12 w-auto"
                />
                <img 
                  src={logo2} 
                  alt="Dripfield.pro Logo" 
                  className="h-12 w-auto absolute top-0 left-0 iris-reveal"
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
            }
            rightSideElements={<UserMenu />}
          />
        </header>
      </div>

      {/* Content container */}
      <div 
        className="flex-1 flex overflow-x-hidden max-w-full"
        style={{
          backgroundImage: `url(${bgTile})`,
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'scroll',
          backgroundPosition: '0 0',
          backgroundSize: 'auto'
        }}
      >
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
        } lg:hidden fixed w-64 h-[calc(100%)] top-[50px] z-[30000] transition-transform duration-300 ease-in-out`}>
          <Sidebar 
            onNavigate={() => setIsSidebarOpen(false)} 
            openShowModal={openShowModal}
            isAdmin={isAdmin}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={true}
          />
        </div>

        {/* Main content wrapper */}
        <div 
          className="flex-1 flex flex-col relative max-w-full min-w-0 w-full"
        >
          {/* Mobile-only header */}
          <header className="z-20 bg-canvas border-b border-fourth p-2 lg:hidden shadow-xl">
            <div className="relative flex items-center justify-center max-w-[1280px] mx-auto w-full px-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute left-2 p-1 rounded-md bg-tertiary hover:bg-primary text-fifth transition-colors border border-fifth"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogoClick}
                className="focus:outline-none mr-4 relative iris-effect rounded-lg"
              >
                <img 
                  src={logo} 
                  alt="Dripfield.pro Logo" 
                  className="h-10 w-auto"
                />
                <img 
                  src={logo2} 
                  alt="Dripfield.pro Logo" 
                  className="h-10 w-auto absolute top-0 left-0 iris-reveal"
                />
              </button>
              <div className="absolute right-2 flex items-center">
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden flex flex-col">
            <div className="flex-1 p-4">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/years/:year?" element={<Years />} />
                <Route path="/tours/:tour?" element={<Tours />} />
                <Route path="/songs" element={<Songs />} />
                <Route path="/personnel" element={<Guests />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/personnel/:PersonnelID" element={<Guest />} />
                <Route path="/venue/:venueId" element={<Venue />} />
                <Route path="/setlist/:showId" element={<Setlist />} />
                <Route path="/song/:songId" element={<Song />} />
                <Route path="/user/:userId" element={<PublicProfile />} />
                <Route path="/discography" element={<Discography />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/lists/:listId" element={<ListInd />} />
                <Route path="/joty/:year?" element={<Joty />} />
                <Route path="/submit" element={<Submit />} />
                
                {/* Authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                
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
                <Route path="/setlistgame/tour/:tourId" element={<TourDetailsPage />} />
                <Route path="/setlistgame/:showId" element={<SetlistGameShowPage />} />
              </Routes>
            </div>
            
            {/* Footer */}
            <footer className="text-center text-fifth/70 text-[0.625rem] leading-[0.75rem] mt-4">
              <div className="bg-primary lg:max-w-none max-w-[1280px] lg:mx-0 mx-auto px-4 py-1 border-t border-fourth">
                <p>All statistical information and computations copyright ©2025, Brian Watson and Dripfield.pro. No portion of this website's content may be reproduced without permission. Song lyrics and titles are the copyright of No Coincidence Records, Factory Underground Records, and their respective publishers, including Lantern Collective, Master Cat Music, Gong Gang, Potato Party, Space Panther Music, and Spun Haus Productions. Show posters and artwork are the copyright of their respective artists.</p>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Find a Show Modal - Positioned at the root level */}
      {isShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsShowModalOpen(false)}></div>
          <div className="relative bg-primary border border-fourth rounded-lg p-4 w-full max-w-md mx-4">
            <button
              onClick={() => setIsShowModalOpen(false)}
              className="absolute top-4 right-4 rounded-md text-fifth hover:text-tertiary focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-4">Find a Show or User</h2>
            
            {/* Show search form */}
            <form onSubmit={handleShowSearch} className="space-y-4 mb-4">
              <div>
                <label htmlFor="showId" className="block text-sm font-medium text-fifth mb-1">
                  Enter Show ID
                </label>
                <input
                  type="text"
                  id="showId"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-canvas border border-fourth rounded-md text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-sm"
                  placeholder="Enter Show ID"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-tertiary hover:bg-tertiary/70 text-fifth font-medium rounded-md transition-colors border border-fourth"
              >
                Go to Show
              </button>
            </form>
            
            {/* User search form */}
            <form onSubmit={handleUserSearch} className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-fifth mb-1">
                  Enter User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-canvas border border-fourth rounded-md text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-sm"
                  placeholder="Enter User ID"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-tertiary hover:bg-tertiary/70 text-fifth font-medium rounded-md transition-colors border border-fourth"
              >
                Go to User
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
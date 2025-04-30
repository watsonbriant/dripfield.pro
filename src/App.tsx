import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';
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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [showId, setShowId] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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

  const handleLogoClick = () => {
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
      {/* Header - Only shown on desktop */}
      <header className="z-20 bg-primary border-b border-white/10 p-4 md:sticky md:top-0 hidden md:block">
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleLogoClick}
            className="focus:outline-none"
          >
            <img 
              src="../src/img/MoonCabin_Logo.jpg" 
              alt="MoonCabin Logo" 
              className="h-10 w-auto"
            />
          </button>
          <div className="absolute right-0 flex items-center">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content container */}
      <div className="flex-1 flex md:overflow-hidden">
        {/* Overlay - make sure it's behind the sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - ensure it's above the overlay */}
        <div className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static w-64 h-[calc(100%)] top-[50px] md:top-0 z-30 transition-transform duration-300 ease-in-out`}>
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
          <header className="z-20 bg-primary border-b border-white/10 p-4 md:hidden">
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute left-0 p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogoClick}
                className="focus:outline-none"
              >
                <img 
                  src="../src/img/MoonCabin_Logo.jpg" 
                  alt="MoonCabin Logo" 
                  className="h-8 w-auto"
                />
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
            </Routes>
          </main>
        </div>
      </div>

      {/* Find a Show Modal - Positioned at the root level */}
      {isShowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsShowModalOpen(false)}></div>
          <div className="relative bg-[#172330] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
            <button
              onClick={() => setIsShowModalOpen(false)}
              className="absolute top-4 right-4 rounded-md text-[#fce7ca] hover:text-white focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-medium text-white mb-4">Find a Show</h2>
            <form onSubmit={handleShowSearch} className="space-y-4">
              <div>
                <label htmlFor="showId" className="block text-sm font-medium text-[#fce7ca]/80 mb-1">
                  Enter Show ID
                </label>
                <input
                  type="text"
                  id="showId"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
                  placeholder="Enter show ID"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors"
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
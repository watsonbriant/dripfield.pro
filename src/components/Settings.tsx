import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProfileData {
  username?: string;
  website?: string;
  // Add any other profile fields you want
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setProfileLoading(true);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, website')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setWebsite(data.website || '');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setProfileLoading(true);
      setMessage(null);
      setError(null);
      
      if (!user) return;
  
      // Check if username already exists (and isn't the current user's)
      if (username && username !== profile.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id)
          .single();
        
        if (!checkError && existingUser) {
          setError('Username already taken. Please choose another.');
          setProfileLoading(false);
          return;
        }
      }
  
      const updates = {
        id: user.id,
        username,
        website,
        updated_at: new Date().toISOString(),
      };
  
      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { returning: 'minimal' });
  
      if (error) throw error;
  
      setMessage('Profile updated successfully');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProfileLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setMessage('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-fourth">Settings</h1>
      
      {/* Profile Section */}
      <div className="mt-8 bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2">Your Profile</h2>
        
        {message && (
          <p className="text-sm bg-green-100 text-green-800 px-2 py-1.5 rounded-full border border-green-300 mb-4">{message}</p>
        )}
        
        {error && (
          <p className="text-sm bg-red-100 text-red-800 px-2 py-1.5 rounded-full border border-red-300 mb-4">{error}</p>
        )}

        <div className="space-y-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fifth mb-1">
              Email
            </label>
            <input
              type="text"
              name="email"
              id="email"
              value={user?.email || ''}
              disabled
              className="text-sm w-full px-2 py-1.5 font-light rounded-lg border border-secondary/20 bg-canvas text-fifth/70 placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-fifth mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 16))}
              className="text-sm w-full px-2 py-1.5 rounded-lg font-light border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              placeholder="Set username (max 16 characters)"
              maxLength={16}
            />
            <p className="text-xs text-fifth/50 mt-1">(maximum 16 characters)</p>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-fifth mb-1">
              Website
            </label>
            <input
              type="text"
              name="website"
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="text-sm w-full px-2 py-1.5 rounded-lg font-light border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              placeholder="Your website URL"
            />
          </div>
        </div>
        
        <div className="mt-3">
          <button
            type="button"
            onClick={updateProfile}
            disabled={profileLoading}
            className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-fourth ${
              profileLoading
              ? 'bg-tertiary/50 cursor-not-allowed'
              : 'bg-tertiary hover:bg-tertiary/80'
            } text-fifth`}
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
      
      {/* Password Section */}
      <div className="mt-8 bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2">Update Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fifth mb-1">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg text-sm border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              placeholder="New password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-fifth mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg text-sm border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors border border-fourth ${
              loading
              ? 'bg-tertiary/50 cursor-not-allowed'
              : 'bg-tertiary hover:bg-tertiary/80'
            } text-fifth`}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
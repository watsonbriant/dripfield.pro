import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    // Validate username
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
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
      // Check if username is already taken
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (existingUser) {
        setError('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Register the user
      const { error, data } = await signUp(email, password);
      
      if (error) throw error;
      
      // Create profile with username
      if (data?.user && data?.session) {
        // Make sure we're using the client with the active session
        const supabaseWithAuth = supabase.auth.setSession(data.session);
        
        // Now attempt the upsert with the established session
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (profileError) throw profileError;
      }
      
      // If user needs to confirm their email
      if (data?.user && !data.session) {
        setMessage('Check your email for a confirmation link');
      } else {
        // Automatically signed in
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mt-8 max-w-md mx-auto bg-[#172330] border border-white/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create a new account</h1>

        {message ? (
          <div className="p-4 bg-green-500/20 rounded-lg mb-4">
            <p className="text-sm text-green-400">{message}</p>
            <div className="mt-4">
              <Link
                to="/login"
                className="w-full px-4 py-2 text-white rounded-lg font-medium transition-colors bg-tertiary hover:bg-tertiary/80 flex justify-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#fce7ca]/90 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#fce7ca]/90 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 16))}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Choose a username"
                maxLength={16}
              />
              <p className="text-xs text-[#fce7ca]/50 mt-1">(maximum 16 characters)</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#fce7ca]/90 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Create password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#fce7ca]/90 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                loading
                ? 'bg-tertiary/50 cursor-not-allowed'
                : 'bg-tertiary hover:bg-tertiary/80'
              }`}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-[#fce7ca]/70 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-tertiary hover:text-tertiary/80">
                  Login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
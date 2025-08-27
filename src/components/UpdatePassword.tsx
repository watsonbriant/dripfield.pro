import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have URL parameters that indicate this is an auth callback
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'recovery') {
          // This is a recovery callback, let Supabase handle it
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Token verification error:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
          } else {
            setHasValidSession(true);
          }
        } else if (session) {
          // User already has a valid session
          setHasValidSession(true);
        } else {
          setError('No valid reset session found. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Something went wrong. Please try requesting a new password reset.');
      } finally {
        setSessionLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-md mx-auto bg-primary border border-secondary rounded-lg shadow-xl">
          <div className="p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
              Update Password
            </h2>
          </div>
          <div className="px-3 pb-3">
            <p className="text-fifth">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-md mx-auto bg-primary border border-secondary rounded-lg shadow-xl">
          <div className="p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
              Update Password
            </h2>
          </div>
          <div className="px-3 pb-3">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg mb-4">
                <p className="text-sm text-fifth">{error}</p>
              </div>
            )}
            <div className="mt-4">
              <Link
                to="/reset-password"
                className="w-full px-4 py-2 text-fifth rounded-lg font-medium transition-colors bg-tertiary hover:bg-tertiary/80 border border-secondary flex justify-center"
              >
                Request New Password Reset
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="max-w-md mx-auto bg-primary border border-secondary rounded-lg shadow-xl">
        <div className="p-3">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
            Update Password
          </h2>
        </div>

        <div className="px-3 pb-3">
          {success ? (
            <div className="p-3 bg-green-500 border border-secondary rounded-lg mb-4">
              <p className="text-sm text-fifth font-medium">
                Password updated successfully! Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-sm text-fifth">{error}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-fifth">
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
                  className="w-full px-3 py-2 rounded-lg border border-secondary bg-canvas text-fifth placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-fifth">
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
                  className="w-full px-3 py-2 rounded-lg border border-secondary bg-canvas text-fifth placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-3 py-1.5 text-fifth rounded-lg font-medium transition-colors border border-secondary ${
                  loading
                    ? 'bg-tertiary/50 cursor-not-allowed'
                    : 'bg-tertiary hover:bg-tertiary/80'
                }`}
              >
                {loading ? 'Updating password...' : 'Update Password'}
              </button>
              
              <div className="mt-3 text-center">
                <p className="text-fifth font-light text-sm">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
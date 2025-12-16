import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { updatePassword, session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRecoveryToken = async () => {
      try {
        // Check if there are URL hash fragments (common in auth callbacks)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session setup error:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
          } else if (data.session) {
            console.log('Session established successfully');
          }
        }

        // Always wait a bit for session to be established
        setTimeout(() => {
          setSessionLoading(false);
        }, 2000);
      } catch (err) {
        console.error('Recovery token handling error:', err);
        setError('Something went wrong with the password reset link.');
        setSessionLoading(false);
      }
    };

    handleRecoveryToken();
  }, []);

  useEffect(() => {
    // If we get a session while still loading, stop loading immediately
    if (session && user) {
      setSessionLoading(false);
    }
  }, [session, user]);

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
      <>
        <Helmet>
          <title>Update Password — Dripfield.pro</title>
        </Helmet>
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl">
            <h2 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">
              Update Password
            </h2>
            <div className="px-2">
              <p className="text-fifth text-xs">Setting up your password reset session...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!session || !user) {
    return (
      <>
        <Helmet>
          <title>Update Password — Dripfield.pro</title>
        </Helmet>
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl">
            <h2 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">
              Update Password
            </h2>
            <div className="px-2">
              <div className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300 mb-4">
                <p>
                  {error || 'No valid reset session found. This might happen if the reset link is expired or has already been used.'}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to="/reset-password"
                  className="w-full px-4 py-2 text-fifth rounded-lg font-medium transition-colors bg-tertiary hover:bg-tertiary/80 border border-fourth flex justify-center"
                >
                  Request New Password Reset
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Update Password — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl">
          <h2 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">
            Update Password
          </h2>

          {success ? (
            <div className="p-3 bg-green-100 rounded-lg border border-green-300 mb-4">
              <p className="text-sm text-green-800 font-medium">
                Password updated successfully! Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              {error && (
                <p className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300">{error}</p>
              )}
              
              <div className="px-2">
                <label htmlFor="password" className="block text-xs font-medium text-fifth mb-1">
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
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Enter new password"
                />
              </div>

              <div className="px-2">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-fifth mb-1">
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
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-2 py-0.5 text-sm rounded-lg font-medium transition-colors border border-fourth ${
                    loading
                      ? 'bg-tertiary/50 cursor-not-allowed'
                      : 'bg-tertiary hover:bg-tertiary/80'
                  } text-fifth`}
                >
                  {loading ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-fifth/70 text-xs mb-1 font-light">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-fifth hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;
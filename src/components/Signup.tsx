import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const DRIPFIELD_X_URL = 'https://x.com/dripfieldpro';
const WYSTERIA_COMMUNITY_URL = 'https://community.wysterialane.org';

export const Signup: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Register an Account — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl pb-4">
          <h1 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">
            Create a New Account
          </h1>
          <Link
            to="/new"
            className="block w-full no-underline hover:no-underline bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-center px-3 py-2 text-xs sm:text-sm font-semibold transition-colors shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] border-b-2 border-red-800 mb-4"
          >
            Account creation is disabled as we are merging with Wysteria Lane Community.{' '}
            <span className="underline font-bold">Click here for more information.</span>
          </Link>
          <div className="text-center">
            <Link
              to="/login"
              className="inline-block px-2 py-0.5 text-fifth rounded-full font-medium transition-colors bg-tertiary hover:bg-tertiary/70 border border-fourth text-xs"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;

/*
 * ---------------------------------------------------------------------------
 * REACTIVATE ACCOUNT CREATION: remove the Signup component above (and the
 * DRIPFIELD_X_URL / WYSTERIA_COMMUNITY_URL constants) and uncomment the block below.
 * ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
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

      const { error, data } = await signUp(email, password);

      if (error) throw error;

      if (data?.user && data?.session) {
        const supabaseWithAuth = supabase.auth.setSession(data.session);

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;
      }

      if (data?.user && !data.session) {
        setMessage('Check your email for a confirmation link');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register an Account — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl">
          <h1 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">Create a New Account</h1>

          {message ? (
            <div className="p-4 bg-green-100 rounded-lg border border-green-300 mb-4">
              <p className="text-sm text-green-800 font-medium">{message}</p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="w-full px-4 py-2 text-fifth rounded-full font-medium transition-colors bg-tertiary hover:bg-tertiary/70 flex justify-center border border-fourth"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              {error && (
                <p className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300">{error}</p>
              )}

              <div className="px-2">
                <label htmlFor="email" className="block text-xs font-medium text-fifth mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Enter email"
                />
              </div>

              <div className="px-2">
                <label htmlFor="username" className="block text-xs font-medium text-fifth mb-1">
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
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Choose a username"
                  maxLength={16}
                />
                <p className="text-xs text-fifth/50 mt-1">(maximum 16 characters)</p>
              </div>

              <div className="px-2">
                <label htmlFor="password" className="block text-xs font-medium text-fifth mb-1">
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
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Create password"
                />
              </div>

              <div className="px-2">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-fifth mb-1">
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
                  className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-2 py-0.5 text-sm rounded-lg font-medium transition-colors border border-fourth ${
                    loading ? 'bg-tertiary/50 cursor-not-allowed' : 'bg-tertiary hover:bg-tertiary/80'
                  } text-fifth`}
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-fifth/70 text-xs mb-1 font-light">
                  Already have an account?{' '}
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

export default Signup;

 * ---------------------------------------------------------------------------
 */

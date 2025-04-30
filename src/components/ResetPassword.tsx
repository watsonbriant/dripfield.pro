import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setMessage('Check your email for a password reset link');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset password email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mt-8 max-w-md mx-auto bg-[#172330] border border-white/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Reset your password</h1>

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
                placeholder="Enter your email"
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
              {loading ? 'Sending email...' : 'Send reset instructions'}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-[#fce7ca]/70 text-sm">
                Remember your password?{' '}
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
}
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
      <div className="mt-8 max-w-md mx-auto bg-primary border border-black rounded-lg shadow-xl">
        <div className="p-4 border-b border-black/10">
          <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
            Reset your password
          </h2>
        </div>

        <div className="p-6">
          {message ? (
            <div className="p-4 bg-green-500 border border-black rounded-lg mb-4">
              <p className="text-sm text-black font-medium">{message}</p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="w-full px-4 py-2 text-black rounded-lg font-medium transition-colors bg-tertiary hover:bg-tertiary/80 border border-black flex justify-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-sm text-black">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-black">
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
                  className="w-full px-3 py-2 rounded-lg border border-black bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 text-black rounded-lg font-medium transition-colors border border-black ${
                  loading
                  ? 'bg-tertiary/50 cursor-not-allowed'
                  : 'bg-tertiary hover:bg-tertiary/80'
                }`}
              >
                {loading ? 'Sending email...' : 'Send reset instructions'}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-black text-sm">
                  Remember your password?{' '}
                  <Link to="/login" className="text-blue-600 font-medium hover:underline">
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
}

export default ResetPassword;
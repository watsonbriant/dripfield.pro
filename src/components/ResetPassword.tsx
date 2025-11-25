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
      <div className="max-w-md mx-auto bg-primary border border-fourth rounded-lg shadow-xl">
        <div className="p-3">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">
            Reset your password
          </h2>
        </div>

        <div className="px-3 pb-3">
          {message ? (
            <div className="p-3 bg-green-500 border border-fourth rounded-lg mb-4">
              <p className="text-sm text-fifth font-medium">{message}</p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="w-full px-4 py-2 text-fifth rounded-lg font-medium transition-colors bg-tertiary hover:bg-tertiary/80 border border-fourth flex justify-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-sm text-fifth">{error}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-fifth">
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
                  className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas text-fifth placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-3 py-1.5 text-fifth rounded-lg font-medium transition-colors border border-fourth ${
                  loading
                  ? 'bg-tertiary/50 cursor-not-allowed'
                  : 'bg-tertiary hover:bg-tertiary/80'
                }`}
              >
                {loading ? 'Sending email...' : 'Send reset instructions'}
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
}

export default ResetPassword;
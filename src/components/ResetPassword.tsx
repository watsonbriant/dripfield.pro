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
      <div className="max-w-md mx-auto bg-primary border border-fourth shadow-xl">
        <h2 className="text-base font-semibold bg-tertiary text-fifth px-2 py-0.5 mb-2">
          Reset your password
        </h2>

        {message ? (
          <div className="p-3 bg-green-100 rounded-lg border border-green-300 mb-4">
            <p className="text-sm text-green-800 font-medium">{message}</p>
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
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <p className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300">{error}</p>
            )}
            
            <div className="px-2">
              <label htmlFor="email" className="block text-xs font-medium text-fifth mb-1">
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
                className="w-full px-2 py-1 rounded-lg border border-fourth/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                placeholder="Enter your email"
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
                {loading ? 'Sending email...' : 'Send reset instructions'}
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
  );
}

export default ResetPassword;
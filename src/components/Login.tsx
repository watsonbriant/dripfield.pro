import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      // Show success message briefly before redirect
      setAuthSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mt-8 max-w-md mx-auto bg-primary border border-black rounded-lg p-6">
        <h1 className="text-2xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0.5 rounded-full border border-black mb-6">Sign in to your account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300">{error}</p>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
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
              className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white/90 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-[#f9ae37] text-sm"
              placeholder="ted@goosetheband.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/20 bg-white/90 text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-[#f9ae37] text-sm"
              placeholder="********"
            />
          </div>
          
          <div className="text-sm">
            <Link to="/reset-password" className="text-black font-semibold hover:text-[#f9ae37]">
              Forgot your password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading || authSuccess}
            className={`w-full px-4 py-2 rounded-full font-medium transition-colors border border-black ${
              authSuccess 
                ? 'bg-green-500 text-black cursor-not-allowed'
                : loading
                ? 'bg-[#f9ae37]/50 text-black cursor-not-allowed'
                : 'bg-[#f9ae37] text-black hover:bg-[#f9ae37]/80'
            }`}
          >
            {loading 
              ? 'Signing in...'
              : authSuccess
              ? 'Login successful!'
              : 'Login'}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-black/70 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-black hover:text-[#f9ae37]">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
        // Redirect to the page the user was on before login, or home if no previous page
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="max-w-md mx-auto bg-primary border border-fourth rounded-lg p-3">
        <h1 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-3">Sign in to your account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <p className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-2 rounded-full border border-red-300">{error}</p>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fifth mb-1">
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
              className="w-full px-2 py-1.5 rounded-lg border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
              placeholder="ted@goosetheband.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fifth mb-1">
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
              className="w-full px-2 py-1.5 rounded-lg border border-secondary/20 bg-canvas text-fifth placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
              placeholder="********"
            />
          </div>
          
          <div className="text-sm">
            <Link to="/reset-password" className="text-fifth font-medium hover:underline">
              Forgot your password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading || authSuccess}
            className={`w-full px-3 py-1.5 rounded-lg font-medium transition-colors border border-fourth ${
              authSuccess 
                ? 'bg-green-500 text-fifth cursor-not-allowed'
                : loading
                ? 'bg-tertiary/50 text-fifth cursor-not-allowed'
                : 'bg-tertiary text-fifth hover:bg-tertiary/80'
            }`}
          >
            {loading 
              ? 'Signing in...'
              : authSuccess
              ? 'Login successful!'
              : 'Login'}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-fifth/70 text-sm font-light">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-fifth hover:underline">
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
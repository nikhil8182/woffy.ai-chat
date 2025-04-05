import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check for OAuth redirect result on component mount
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log('Auth session check:', { data, error });
      
      // Get URL parameters to check for auth errors
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (errorParam) {
        console.error('Auth redirect error:', errorParam, errorDescription);
        setError(`Authentication error: ${errorDescription || errorParam}`);
      } else if (data?.session && !error) {
        console.log('User authenticated, redirecting to home');
        navigate('/');
      }
    };
    
    handleOAuthRedirect();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Successfully logged in, redirect to home/chat page
      navigate('/');
    } catch (err) {
      console.error('Error logging in:', err);
      setError(err.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google login flow');
      
      // Use specific scopes and more options to diagnose the issue
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      console.log('Google OAuth response:', { data, error });
      
      if (error) throw error;
      
      // The redirect will happen automatically
    } catch (err) {
      console.error('Error with Google login:', err);
      setError(err.message || 'Failed to login with Google. Please try again.');
      setLoading(false);
    }
  };
  
  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting GitHub login flow');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });
      
      console.log('GitHub OAuth response:', { data, error });
      
      if (error) throw error;
      
      // The redirect will happen automatically
    } catch (err) {
      console.error('Error with GitHub login:', err);
      setError(err.message || 'Failed to login with GitHub. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo">
            <span className="logo-icon">🐺</span>
            <h1>Woffy.ai</h1>
          </div>
          <p className="tagline">Your AI companion for intelligent conversations</p>
        </div>
        
        <div className="auth-form-section">
          <h2>Login</h2>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            

            
            <div className="auth-divider">
              <span>or</span>
            </div>
            
            <div className="social-logins">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="auth-button google-button"
                disabled={loading}
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
              
              <button 
                type="button"
                onClick={handleGitHubLogin}
                className="auth-button github-button"
                disabled={loading}
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.09.682-.218.682-.485 0-.236-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.252-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.026 1.592 1.026 2.683 0 3.842-2.339 4.687-4.566 4.934.359.31.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .269.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>
          </form>
          
          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <div className="auth-redirect">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-background">
        <div className="particles"></div>
      </div>
    </div>
  );
}

export default LoginPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import '../styles/LoginPage.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
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
          <h2>Reset Password</h2>
          
          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div className="auth-success">
              If an account exists with this email, you'll receive a password reset link shortly.
            </div>
          )}
          
          {!success ? (
            <form onSubmit={handleResetPassword} className="auth-form">
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
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setSuccess(false)}
              className="auth-button"
              style={{ marginTop: '20px' }}
            >
              Send Again
            </button>
          )}
          
          <div className="auth-links">
            <div className="auth-redirect">
              Remember your password? <Link to="/login">Login</Link>
            </div>
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

export default ForgotPasswordPage;

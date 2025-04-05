import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, clearError } = useAuth();

  // If already authenticated, redirect to the main chat
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        // Sign up flow
        result = await signUp(email, password);
        if (result.error) throw result.error;
        
        // Show confirmation message for sign up
        setSuccess('Registration successful! You can now sign in with your new account.');
        // Reset the form after signup and switch to login mode
        setEmail('');
        setPassword('');
        setIsSignUp(false);
      } else {
        // Sign in flow
        result = await signIn(email, password);
        if (result.error) throw result.error;
        
        // Success - navigate to main page after login
        navigate('/');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      // Handle specific authentication errors
      if (err.message?.includes('User already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>woffy.ai</h1>
        </div>
        
        <h2>{isSignUp ? 'Create Account' : 'Login'}</h2>
        
        {error && (
          <div className="login-message error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="login-message success">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
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
              disabled={loading}
              minLength={6}
            />
            <small>Password must be at least 6 characters</small>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        
        <div className="auth-toggle">
          <button 
            onClick={toggleAuthMode}
            className="toggle-button"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

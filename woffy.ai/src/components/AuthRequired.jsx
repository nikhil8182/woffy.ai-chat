import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRequired = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // While checking authentication status, show a simple loading indicator
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loader"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the child routes
  return <Outlet />;
};

export default AuthRequired;

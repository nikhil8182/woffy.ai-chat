import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './components/ChatPage';
import NavBar from './components/NavBar';
import SupabaseTest from './components/SupabaseTest';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Auth routes (unprotected) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <div className="authenticated-layout">
                  <NavBar />
                  <main className="app-content">
                    <ChatPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/supabase-test" element={
              <ProtectedRoute>
                <div className="authenticated-layout">
                  <NavBar />
                  <main className="app-content">
                    <SupabaseTest />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route, redirect to login if not authenticated */}
            <Route path="*" element={
              <ProtectedRoute>
                <div className="authenticated-layout">
                  <NavBar />
                  <main className="app-content">
                    <ChatPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './components/ChatPage';
import NavBar from './components/NavBar';
import LoginPage from './components/LoginPage';
import AuthRequired from './components/AuthRequired';
import SupabaseTest from './components/SupabaseTest';
import SupabaseConnection from './components/SupabaseConnection';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/supabase-connection" element={<SupabaseConnection />} />
            
            {/* Protected routes - requires authentication */}
            <Route element={<AuthRequired />}>
              <Route path="/" element={
                <>
                  <NavBar />
                  <main className="app-content">
                    <ChatPage />
                  </main>
                </>
              } />
              <Route path="/supabase-test" element={
                <>
                  <NavBar />
                  <main className="app-content">
                    <SupabaseTest />
                  </main>
                </>
              } />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

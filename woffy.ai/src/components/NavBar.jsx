import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/NavBar.css';

const NavBar = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          woffy.ai
        </Link>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            Chat
          </Link>
          <Link 
            to="/models" 
            className={`nav-item ${location.pathname === '/models' ? 'active' : ''}`}
          >
            Models
          </Link>
          <Link 
            to="/instructions" 
            className={`nav-item ${location.pathname === '/instructions' ? 'active' : ''}`}
          >
            Instructions
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 
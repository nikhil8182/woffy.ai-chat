import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './components/ChatPage';
import AddModelForm from '../frontend/AddModelForm';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/add-model" element={<AddModelForm />} />
            {/* <Route path="*" element={<ChatPage />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

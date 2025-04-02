import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './components/ChatPage';
import InstructionConfig from './components/InstructionConfig';
import ModelsPage from './components/ModelsPage';
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
            <Route path="/instructions" element={<InstructionConfig />} />
            <Route path="/models" element={<ModelsPage />} />
            {/* <Route path="*" element={<ChatPage />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

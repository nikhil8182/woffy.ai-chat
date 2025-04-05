import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/InstructionConfig.css';

const InstructionConfig = () => {
  const [woffyInstruction, setWoffyInstruction] = useState('');
  const [normalInstruction, setNormalInstruction] = useState('');
  const [activeTab, setActiveTab] = useState('woffy_mode');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Fetch instructions on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch saved instructions for both modes
        const instructionResponse = await fetch('http://localhost:8000/api/instructions');
        if (instructionResponse.ok) {
          const instructionData = await instructionResponse.json();
          if (instructionData) {
            setWoffyInstruction(instructionData.woffy_mode || '');
            setNormalInstruction(instructionData.normal_mode || '');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        showNotification('error', `Error loading data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInstructionChange = (e) => {
    if (activeTab === 'woffy_mode') {
      setWoffyInstruction(e.target.value);
    } else {
      setNormalInstruction(e.target.value);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSaving(true);
    
    try {
      const currentInstruction = activeTab === 'woffy_mode' ? woffyInstruction : normalInstruction;
      
      const response = await fetch('http://localhost:8000/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: currentInstruction.trim(),
          mode: activeTab
        }),
      });

      if (response.ok) {
        showNotification('success', `${activeTab === 'woffy_mode' ? 'Woffy Mode' : 'Normal Mode'} instruction saved successfully!`);
      } else {
        const data = await response.json();
        showNotification('error', data.detail || 'Failed to save instruction');
      }
    } catch (error) {
      console.error('Error saving instruction:', error);
      showNotification('error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  return (
    <div className="instruction-config-container">
      {isLoading ? (
        <div className="loading">
          <div className="loader"></div>
          <p>Loading instructions...</p>
        </div>
      ) : (
        <div className="instruction-config-content">
          <div className="instruction-config-card">
            <div className="card-header">
              <h2>Edit AI Instructions</h2>
              <p className="header-subtitle">Configure instructions for each personality mode</p>
            </div>
            
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'woffy_mode' ? 'active' : ''}`}
                onClick={() => handleTabChange('woffy_mode')}
                type="button"
              >
                Woffy Mode
              </button>
              <button 
                className={`tab-button ${activeTab === 'normal_mode' ? 'active' : ''}`}
                onClick={() => handleTabChange('normal_mode')}
                type="button"
              >
                Normal Mode
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="instruction">
                  {activeTab === 'woffy_mode' ? 'Woffy Mode' : 'Normal Mode'} Instructions:
                </label>
                <textarea
                  id="instruction"
                  name="instruction"
                  rows="8"
                  value={activeTab === 'woffy_mode' ? woffyInstruction : normalInstruction}
                  onChange={handleInstructionChange}
                  placeholder="Enter system instructions here..."
                  className="instruction-textarea"
                  disabled={isSaving}
                  required
                ></textarea>
                <p className="help-text">
                  {activeTab === 'woffy_mode' 
                    ? "Instructions for Woffy's dog-like personality. These will be used when Woffy Mode is ON." 
                    : "Instructions for professional AI assistant behavior. These will be used when Woffy Mode is OFF."}
                </p>
              </div>
              
              <div className="button-container">
                <Link to="/" className="back-button">
                  Back to Chat
                </Link>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default InstructionConfig;

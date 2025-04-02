import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/InstructionConfig.css';

const InstructionConfig = () => {
  const [models, setModels] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const navigate = useNavigate();

  // Fetch available models and instructions on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch models
        const modelResponse = await fetch('./model.json');
        if (!modelResponse.ok) {
          throw new Error(`Failed to load models: ${modelResponse.statusText}`);
        }
        const modelData = await modelResponse.json();
        const modelArray = Array.isArray(modelData) ? modelData : [];
        setModels(modelArray);
        
        // Fetch saved common instruction
        const instructionResponse = await fetch('http://localhost:8000/api/instructions');
        if (instructionResponse.ok) {
          const instructionData = await instructionResponse.json();
          if (instructionData && instructionData.instruction) {
            setInstruction(instructionData.instruction);
          } else {
            setInstruction('');
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

  // We no longer need handleModelChange since we're using common instructions

  const handleInstructionChange = (e) => {
    setInstruction(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSaving(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction.trim()
        }),
      });

      if (response.ok) {
        showNotification('success', 'Common instruction saved successfully!');
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
          <p>Loading models and instructions...</p>
        </div>
      ) : (
        <div className="instruction-config-content">
          <div className="instruction-config-card">
            <h2 className="instruction-config-title">AI Instructions Configuration</h2>
            
            {models.length === 0 ? (
              <div className="no-models-message">
                <p>No AI models found. Please add a model first.</p>
                <Link to="/add-model" className="add-model-button">
                  Add Model
                </Link>
              </div>
            ) : (
              <form className="instruction-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="instruction">System Instructions for All Models</label>
                  <textarea
                    id="instruction"
                    className="instruction-textarea"
                    value={instruction}
                    onChange={handleInstructionChange}
                    placeholder="Enter system instructions that will apply to all AI models..."
                    rows="8"
                    disabled={isSaving}
                  />
                  <p className="description">
                    These instructions will guide the behavior of all AI models. For example: "You are a helpful assistant specialized in programming."
                  </p>
                </div>
                
                <div className="available-models">
                  <h3>Available Models</h3>
                  <ul className="model-list">
                    {models.length > 0 ? (
                      models.map((model, index) => (
                        <li key={model.api_name || index} className="model-item">
                          <span className="model-name">{model['name to show']}</span>
                          {model.description && (
                            <span className="model-description">{model.description}</span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="no-models">No models available</li>
                    )}
                  </ul>
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
            )}
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

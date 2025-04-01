import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm Woffy. How can I help you today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // In a real application, this would be an API fetch
        // For this demo, we'll use a direct fetch to the JSON file
        const response = await fetch('/model.json');
        
        if (!response.ok) {
          throw new Error('Failed to load models');
        }
        
        const data = await response.json();
        const modelArray = Array.isArray(data) ? data : [data];
        setModels(modelArray);
        
        // Set the first model as selected if available
        if (modelArray.length > 0) {
          setSelectedModel(modelArray[0]);
          // Add a system message about the selected model
          setMessages(prev => [
            ...prev,
            {
              id: prev.length + 1,
              text: `I'm using the ${modelArray[0]['name to show']} model. How can I help you?`,
              isUser: false,
              isSystem: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Add a fallback message
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            text: 'No AI models found. Please add a model in the "Add Model" page.',
            isUser: false,
            isSystem: true
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModels();

    // Focus input after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const handleModelChange = (e) => {
    const modelId = parseInt(e.target.value, 10);
    const model = models[modelId];
    setSelectedModel(model);
    
    // Add a system message about changing the model
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text: `Switched to the ${model['name to show']} model. How can I help you?`,
        isUser: false,
        isSystem: true
      }
    ]);

    // Focus back on input field
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isSending) return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');
    setIsSending(true);

    // Simulate AI response (would be replaced with actual API call)
    setTimeout(() => {
      let responseText = "I'm just a demo version of Woffy. In a real application, I would respond to your message intelligently!";
      
      if (selectedModel) {
        responseText += ` (Using ${selectedModel['name to show']} model)`;
      } else {
        responseText += " No AI model is currently selected.";
      }
      
      const aiResponse = {
        id: messages.length + 2,
        text: responseText,
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setIsSending(false);
      
      // Focus back on input field
      inputRef.current?.focus();
    }, 1500);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handler for keydown events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      {isLoading ? (
        <div className="chat-loading">
          <div className="loader"></div>
          <p>Loading AI models...</p>
        </div>
      ) : (
        <>
          {models.length > 0 ? (
            <div className="model-selector">
              <label htmlFor="model-select">Choose an AI model:</label>
              <select 
                id="model-select"
                onChange={handleModelChange}
                className="model-select"
              >
                {models.map((model, index) => (
                  <option key={index} value={index}>
                    {model['name to show']}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="no-models-banner">
              <p>No AI models available.</p>
              <Link to="/add-model" className="add-model-link">Add your first model</Link>
            </div>
          )}
          
          <div className="messages-container">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.isUser ? 'user-message' : 'ai-message'} ${message.isSystem ? 'system-message' : ''}`}
              >
                {!message.isSystem && (
                  <div className="message-avatar">
                    {message.isUser ? '👤' : '🤖'}
                  </div>
                )}
                <div className="message-bubble">
                  {message.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="message ai-message typing-indicator">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isSending ? "Woffy is typing..." : "Type your message here..."}
              className="message-input"
              disabled={isSending || models.length === 0}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={isSending || inputValue.trim() === '' || models.length === 0}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPage; 
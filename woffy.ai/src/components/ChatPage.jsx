import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ChatPage.css';

// Helper function to format messages for API
const formatMessagesForApi = (msgs) => {
  return msgs
    .filter(msg => !msg.isSystem) // Exclude system messages
    .map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]); // Start with empty, models will populate initial message
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      setError(null); // Clear previous errors
      setIsLoading(true);
      try {
        const response = await fetch('/model.json'); // Assumes model.json is in the public folder
        if (!response.ok) {
          throw new Error(`Failed to load models: ${response.statusText}`);
        }
        const data = await response.json();
        const modelArray = Array.isArray(data) ? data : []; // Ensure it's an array
        setModels(modelArray);
        
        if (modelArray.length > 0) {
          const firstModel = modelArray[0];
          setSelectedModel(firstModel);
          setMessages([
            {
              id: Date.now(), // Use timestamp for potentially better unique ID
              text: `Using ${firstModel['name to show']}. How can I help?`,
              isUser: false,
              isSystem: true
            }
          ]);
        } else {
           setMessages([
            {
              id: Date.now(),
              text: 'No AI models found. Please add a model via the main menu.',
              isUser: false,
              isSystem: true
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading models:', err);
        setError(err.message);
        setMessages([
          {
            id: Date.now(),
            text: `Error loading models: ${err.message}. Please check console or add a model.`, 
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
    const modelIndex = parseInt(e.target.value, 10);
    const model = models[modelIndex];
    setSelectedModel(model);
    setError(null); // Clear error on model change
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        text: `Switched to ${model['name to show']}. How can I help you?`,
        isUser: false,
        isSystem: true
      }
    ]);

    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => { // Make handleSubmit async
    e.preventDefault();
    if (inputValue.trim() === '' || isSending || isLoading || !selectedModel) return;

    setError(null); // Clear previous errors
    const userMessageId = Date.now();
    const newUserMessage = {
      id: userMessageId,
      text: inputValue,
      isUser: true,
    };

    // Add user message to state immediately
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages); 
    setInputValue('');
    setIsSending(true);

    // --- Start API Call --- 
    const messagesToSend = formatMessagesForApi(updatedMessages); // Format messages for backend
    const modelApiName = selectedModel?.api_name;

    // Double check model is selected (should be covered by initial check, but good practice)
    if (!modelApiName) {
        console.error("No model selected!");
        setError("No model selected!"); 
        setIsSending(false);
        return;
    }

    try {
      const backendUrl = 'http://localhost:8000/api/chat'; // FastAPI backend URL
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelApiName,
          messages: messagesToSend,
        }),
      });

      let responseToAdd; // To store the message object to add to state

      if (!response.ok) {
        let errorDetail = 'Failed to get response from AI.';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (parseError) {
          // If parsing error JSON fails, use the status text
          errorDetail = response.statusText;
        }
        console.error('Backend error:', response.status, errorDetail);
        setError(`Error ${response.status}: ${errorDetail}`); 
        // Create an error message object to display in chat
        responseToAdd = {
          id: Date.now(),
          text: `Error: ${errorDetail}`,
          isUser: false,
          isSystem: true, // Show backend errors as system messages
        };

      } else {
        // Process successful response
        const backendMessage = await response.json(); // { role: 'assistant', content: '...' }
        // Create a message object for the chat state
        responseToAdd = {
          id: Date.now(), 
          text: backendMessage.content,
          isUser: false, // AI response is never from the user
        };
      }
      // Add the AI's response (or error message) to the state
      setMessages(currentMessages => [...currentMessages, responseToAdd]);

    } catch (err) {
      console.error('Network or other error sending message:', err);
      setError(`Network Error: ${err.message}`);
      // Create a network error message object
      const networkErrorResponse = {
        id: Date.now(), 
        text: `Network Error: Could not reach AI service. (${err.message})`,
        isUser: false,
        isSystem: true, // Show network errors as system messages
      };
      setMessages(currentMessages => [...currentMessages, networkErrorResponse]);
    } finally {
      setIsSending(false); // Stop loading indicator regardless of success/failure
      // Optional: Focus back on input field only on success?
      // inputRef.current?.focus(); 
    }
    // --- End API Call ---
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
              <label htmlFor="model-select">AI Model:</label>
              <select 
                id="model-select"
                value={models.findIndex(m => m.api_name === selectedModel?.api_name)} // Control select value
                onChange={handleModelChange}
                className="model-select"
                disabled={isSending} // Disable while sending
              >
                {models.map((model, index) => (
                  <option key={model.api_name || index} value={index}>
                    {model['name to show']}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            !error && (
              <div className="no-models-banner">
                 <p>No AI models loaded.</p>
                 {/* Consider adding a Link to an 'add model' page if applicable */}
                 {/* <Link to="/add-model" className="add-model-link">Add a model</Link> */}
              </div>
            )
          )}

          {error && <div className="chat-error-banner">Error: {error}</div>} 
          
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

          <form onSubmit={handleSubmit} className="input-form">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} // Use onKeyDown for Enter press
              placeholder={selectedModel ? `Message ${selectedModel['name to show']}...` : "Select a model first..."}
              className="chat-input"
              rows="1" // Start with 1 row, CSS will handle expansion
              disabled={isSending || isLoading || !selectedModel || error}
            />
            <button 
              type="submit" 
              className="send-button" 
              disabled={isSending || isLoading || !selectedModel || inputValue.trim() === '' || error}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPage;
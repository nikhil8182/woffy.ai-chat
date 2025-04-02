import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import '../styles/ChatPage.css';

// Configure marked with custom renderer for code blocks
const renderer = new marked.Renderer();

// Original code block renderer
const originalCodeRenderer = renderer.code.bind(renderer);

// Custom renderer for code blocks without copy buttons
renderer.code = function(code, language) {
  // Get original HTML from default renderer
  const html = originalCodeRenderer(code, language);
  
  // Wrap the HTML with a container and language header but no copy button
  return `
    <div class="code-block-container">
      <div class="code-block-header">
        ${language ? `<span class="code-language">${language}</span>` : ''}
      </div>
      ${html}
    </div>
  `;
};

// Configure marked to use the custom renderer
marked.setOptions({ renderer });

// Helper function to format messages for API
const formatMessagesForApi = (msgs) => {
  return msgs
    .filter(msg => !msg.isSystem) // Exclude system messages
    .map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));
};

// Copy code function removed

const ChatPage = () => {
  const [messages, setMessages] = useState([]); // Start with empty, models will populate initial message
  const [inputValue, setInputValue] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const [inputRows, setInputRows] = useState(1); // Track textarea rows
  const [hasInstruction, setHasInstruction] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true); // Track if auto-scrolling is enabled
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const touchStartRef = useRef(null); // Track touch start position for mobile

  // Function to fetch the latest models
  const fetchModels = async () => {
    try {
      // Always fetch the latest model.json from the server
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const modelResponse = await fetch(`/model.json?t=${timestamp}`);
      if (!modelResponse.ok) {
        throw new Error(`Failed to load models: ${modelResponse.statusText}`);
      }
      const modelData = await modelResponse.json();
      const modelArray = Array.isArray(modelData) ? modelData : []; // Ensure it's an array
      setModels(modelArray);
      console.log('Models refreshed successfully:', modelArray);
      return modelArray;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  };

  // Fetch available models and instructions on component mount
  useEffect(() => {
    const loadData = async () => {
      setError(null); // Clear previous errors
      setIsLoading(true);
      
      // First set a default message while loading
      setMessages([{
        id: Date.now(),
        text: 'Loading AI models...',
        isUser: false,
        isSystem: true
      }]);
      
      try {
        // Fetch models
        let modelArray = [];
        try {
          modelArray = await fetchModels();
          console.log('Models loaded successfully:', modelArray);
        } catch (modelErr) {
          console.error('Error loading models:', modelErr);
          throw new Error(`Could not load models: ${modelErr.message}`);
        }
        
        // Fetch instruction - this is non-critical
        try {
          const instructionResponse = await fetch('http://localhost:8000/api/instructions');
          if (instructionResponse.ok) {
            const instructionData = await instructionResponse.json();
            const hasInst = instructionData && instructionData.instruction && instructionData.instruction.trim() !== '';
            setHasInstruction(hasInst);
            console.log('Instruction loaded successfully:', instructionData);
          }
        } catch (instructionErr) {
          console.warn('Could not load instruction:', instructionErr);
          // Don't throw error for instruction - non-critical
        }
        
        // Clear loading state as we have the models now
        setIsLoading(false);
        
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
        setIsLoading(false);
        setError(err.message);
        setMessages([
          {
            id: Date.now(),
            text: `Error loading models: ${err.message}. Please check console or add a model.`, 
            isUser: false,
            isSystem: true
          }
        ]);
      }
    };
    
    loadData(); // Call the loadData function instead of loadModels

    // Focus input after a short delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const handleModelChange = (e) => {
    const modelIndex = parseInt(e.target.value, 10);
    if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= models.length) {
      console.error('Invalid model index:', e.target.value);
      return;
    }
    
    const model = models[modelIndex];
    if (!model) {
      console.error('Model not found at index:', modelIndex);
      return;
    }
    
    console.log('Selected model:', model);
    setSelectedModel(model);
    setError(null); // Clear error on model change
    
    // We now use a common instruction for all models
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        text: `Switched to ${model['name to show']}${hasInstruction ? ' with custom instructions' : ''}. How can I help you?`,
        isUser: false,
        isSystem: true
      }
    ]);

    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea based on content
    const textareaLineHeight = 24; // Approximate line height in pixels
    const minRows = 1;
    const maxRows = 5;
    
    const previousRows = e.target.rows;
    e.target.rows = minRows; // Reset rows to calculate scroll height
    
    const currentRows = Math.floor(e.target.scrollHeight / textareaLineHeight);
    
    if (currentRows === previousRows) {
      e.target.rows = currentRows;
    }
    
    if (currentRows >= maxRows) {
      e.target.rows = maxRows;
      e.target.scrollTop = e.target.scrollHeight;
    }
    
    setInputRows(Math.min(currentRows, maxRows));
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
      // Construct the backend URL dynamically
      const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Default to localhost if var not set
      const backendUrl = `${baseApiUrl}/api/chat`;

      // Log the URL being used for debugging
      console.log("Sending request to:", backendUrl);

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

  // Check if user is at the bottom of the chat
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const tolerance = 10; // pixels of tolerance
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= tolerance;
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current && autoScroll) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      requestAnimationFrame(() => {
        messagesContainerRef.current?.scrollTo({
          top: scrollHeight - clientHeight,
          behavior
        });
      });
    }
  }, [autoScroll]);

  // Handle user scroll events
  const handleScroll = useCallback(() => {
    setAutoScroll(isAtBottom());
  }, [isAtBottom]);

  // Handle mouse wheel events
  const handleWheel = useCallback((e) => {
    if (e.deltaY < 0) { // scrolling up
      setAutoScroll(false);
    } else if (isAtBottom()) { // scrolling down and at bottom
      setAutoScroll(true);
    }
  }, [isAtBottom]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.touches[0].clientY;
    const diff = touchStartRef.current - touchEnd;
    
    if (diff < 0) { // scrolling up
      setAutoScroll(false);
    } else if (isAtBottom()) { // scrolling down and at bottom
      setAutoScroll(true);
    }
  }, [isAtBottom]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    if (isAtBottom()) {
      setAutoScroll(true);
    }
  }, [isAtBottom]);

  // Setup scroll listeners
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Use passive listeners for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScroll, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  


  // Handler for keydown events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Calculate the base API URL once
  const baseApiUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', []);

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
              {/* Completely rebuilt model selector without the refresh button */}
              <select 
                id="model-select"
                value={models.findIndex(m => m.api_name === selectedModel?.api_name)}
                onChange={handleModelChange}
                className="model-select model-select-standalone"
                disabled={isSending}
              >
                {models.map((model, index) => (
                  <option key={model.api_name || index} value={index}>
                    {model['name to show']}
                  </option>
                ))}
              </select>
              {/* Instruction indicator removed */}
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
          
          <div className="messages-container prompt-kit-chat-container" ref={messagesContainerRef}>
            <div className="prompt-kit-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`prompt-kit-message ${message.isUser ? 'prompt-kit-user-message' : 'prompt-kit-ai-message'} ${message.isSystem ? 'prompt-kit-system-message' : ''}`}
                >
                  {!message.isSystem && (
                    <div className="prompt-kit-avatar">
                      {message.isUser ? (
                        <div className="prompt-kit-user-avatar">👤</div>
                      ) : (
                        <div className="prompt-kit-assistant-avatar">🐶</div>
                      )}
                    </div>
                  )}
                  <div className="prompt-kit-content">
                    {!message.isSystem && (
                      <div className="prompt-kit-header">
                        <div className="prompt-kit-name">
                          {message.isUser ? 'You' : selectedModel?.['name to show'] || 'AI Assistant'}
                        </div>
                        <div className="prompt-kit-timestamp">
                          {new Date(message.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    )}
                    <div className="prompt-kit-bubble">
                      <div className="message-content-wrapper">
                        {message.isUser || message.isSystem ? (
                          message.text
                        ) : (
                          <div 
                            className="markdown-content"
                            dangerouslySetInnerHTML={{ 
                              __html: DOMPurify.sanitize(marked.parse(message.text)) 
                            }}
                          />
                        )}
                        {/* Copy message button removed */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="prompt-kit-message prompt-kit-ai-message prompt-kit-typing">
                  <div className="prompt-kit-avatar">
                    <div className="prompt-kit-assistant-avatar">🐶</div>
                  </div>
                  <div className="prompt-kit-content">
                    <div className="prompt-kit-header">
                      <div className="prompt-kit-name">
                        {selectedModel?.['name to show'] || 'AI Assistant'}
                      </div>
                    </div>
                    <div className="prompt-kit-bubble prompt-kit-typing-bubble">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="prompt-kit-scroll-anchor" ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="prompt-kit-form">
            <div className="prompt-kit-input-container">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={selectedModel ? `Message ${selectedModel['name to show']}...` : "Select a model first..."}
                className="prompt-kit-textarea"
                rows={inputRows}
                disabled={isSending || isLoading || !selectedModel || error}
              />
              <button 
                type="submit" 
                className="prompt-kit-send-button" 
                disabled={isSending || isLoading || !selectedModel || inputValue.trim() === '' || error}
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="prompt-kit-send-icon">
                  <path d="M1.724 1.053a.5.5 0 0 0-.714.545l1.403 4.85a.5.5 0 0 0 .397.354l5.69.953c.268.053.268.437 0 .49l-5.69.953a.5.5 0 0 0-.397.354l-1.403 4.85a.5.5 0 0 0 .714.545l13-6.5a.5.5 0 0 0 0-.894l-13-6.5Z" />
                </svg>
              </button>
            </div>
            {error && <div className="prompt-kit-error">{error}</div>}
            {!autoScroll && (
              <button 
                className="scroll-button" 
                onClick={() => {
                  setAutoScroll(true);
                  scrollToBottom();
                }}
                aria-label="Scroll to bottom"
              >
                ↓
              </button>
            )}
          </form>
          {/* Backend URL debug display removed */}
        </>
      )}
    </div>
  );
};

export default ChatPage;
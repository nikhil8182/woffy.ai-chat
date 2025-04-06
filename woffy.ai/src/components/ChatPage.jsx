import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ChatAnimation from './ChatAnimation';
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

const ChatPage = () => {
  const [messages, setMessages] = useState([]); // Start with empty messages array
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const [inputRows, setInputRows] = useState(1); // Track textarea rows
  const [autoScroll, setAutoScroll] = useState(true); // Track if auto-scrolling is enabled
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const touchStartRef = useRef(null); // Track touch start position for mobile

  // Hardcoded model information (hidden from user)
  const hardcodedModel = {
    'name to show': 'Woffy',
    'api_name': 'openai/gpt-4o-search-preview', // Hidden from UI
    'description': 'Your friendly AI dog assistant',
  };

  // Initialize chat and fetch instructions on component mount
  useEffect(() => {
    const loadData = async () => {
      setError(null); // Clear previous errors
      setIsLoading(true);
      
      try {
        // Add an initial AI greeting
        const greeting = `Hello! I'm Woffy, your friendly AI assistant. How can I help you today?`;
        setMessages([{
          id: Date.now(),
          text: greeting,
          isUser: false,
        }]);
        
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(`Error initializing chat: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    loadData();

    // Register window resize listener for mobile view
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Window resize handler for responsive adjustments
  const handleWindowResize = useCallback(() => {
    // Any window resize logic here (for responsive UI)
  }, []);

  // Function to scroll to bottom of chat  
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Handler for textarea input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const currentRows = e.target.value.split('\n').length;
    const maxRows = 5; // Max rows before scrolling
    
    setInputRows(Math.min(currentRows, maxRows));
  };

  const handleSubmit = async (e) => { // Make handleSubmit async
    e.preventDefault();
    if (inputValue.trim() === '' || isSending || isLoading) return;

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
    const modelApiName = hardcodedModel.api_name;

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
          messages: messagesToSend
        }),
      });

      let responseToAdd; // To store the message object to add to state

      if (!response.ok) {
        let errorDetail = 'Failed to get response from AI.';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
          
          // Check for rate limit errors (quota exceeded)
          const isRateLimited = 
            (typeof errorDetail === 'string' && (errorDetail.includes('Quota exceeded') || errorDetail.includes('rate limit'))) ||
            (typeof errorData.error === 'object' && errorData.error?.code === 429) ||
            response.status === 429;
          
          if (isRateLimited) {
            const friendlyMessage = `This model (${hardcodedModel['name to show']}) has reached its rate limit. Please try:
1. Waiting a minute before sending another message
2. Refreshing the page and trying again`;
            console.error('Rate limit error:', errorDetail);
            setError(friendlyMessage);
            responseToAdd = {
              id: Date.now(),
              text: friendlyMessage,
              isUser: false,
              isSystem: true
            };
          } else {
            console.error('Backend error:', response.status, errorDetail);
            setError(`Error ${response.status}: ${errorDetail}`);
            // Create an error message object to display in chat
            responseToAdd = {
              id: Date.now(),
              text: `Error: ${errorDetail}`,
              isUser: false,
              isSystem: true, // Show backend errors as system messages
            };
          }
        } catch (parseError) {
          // If parsing error JSON fails, use the status text
          errorDetail = response.statusText;
          console.error('Backend error:', response.status, errorDetail);
          setError(`Error ${response.status}: ${errorDetail}`);
          // Create an error message object to display in chat
          responseToAdd = {
            id: Date.now(),
            text: `Error: ${errorDetail}`,
            isUser: false,
            isSystem: true // Show backend errors as system messages
          };
        }

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
    
    const threshold = 100; // Allow small scroll up without disabling auto-scroll
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Handle scroll events
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

  // Handle touch start events for mobile
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
      <ChatAnimation />
      {isLoading ? (
        <div className="chat-loading">
          <div className="loader"></div>
          <p>Initializing chat...</p>
        </div>
      ) : error && !messages.length ? (
        <div className="chat-error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chat-controls">
            {/* Woffy Mode toggle removed */}
          </div>
          
          <div className="messages-container" ref={messagesContainerRef}>
            <div className="chat-messages prompt-kit-messages">
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
                          {message.isUser ? 'You' : hardcodedModel['name to show']}
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
                        {hardcodedModel['name to show']}
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
                placeholder={`Message ${hardcodedModel['name to show']}...`}
                className="prompt-kit-textarea"
                rows={inputRows}
                disabled={isSending || isLoading || error}
              />
              <button 
                type="submit" 
                className="prompt-kit-send-button" 
                disabled={isSending || isLoading || inputValue.trim() === '' || error}
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
        </>
      )}
    </div>
  );
};

export default ChatPage;

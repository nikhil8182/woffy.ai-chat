import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatPage.css';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm Woffy. How can I help you today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');

    // Simulate AI response (would be replaced with actual API call)
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I'm just a demo version of Woffy. In a real application, I would respond to your message intelligently!",
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
    }, 1000);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>woffy.ai</h1>
      </header>

      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-bubble">
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage; 
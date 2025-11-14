import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const RestaurantChatbot = ({ onCategorySelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Welcome to Smart Restaurant! 👋',
      timestamp: new Date()
    },
    {
      type: 'bot',
      text: 'I can help you explore our menu. Click on a category below or ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Category configuration matching your MenuPage
  const categories = [
    { id: 'Main Course', name: 'Main Course', emoji: '🍖', color: '#dc2626' },
    { id: 'Indian Food', name: 'Indian Food', emoji: '🍛', color: '#ea580c' },
    { id: 'Fast Food', name: 'Fast Food', emoji: '🍔', color: '#d97706' },
    { id: 'Seafood', name: 'Seafood', emoji: '🦞', color: '#059669' },
    { id: 'Appetizers', name: 'Appetizers', emoji: '🥗', color: '#0891b2' },
    { id: 'Salads', name: 'Salads', emoji: '🥬', color: '#10b981' },
    { id: 'Soup', name: 'Soup', emoji: '🍲', color: '#8b5cf6' },
    { id: 'Beverages', name: 'Beverages', emoji: '🥤', color: '#3b82f6' },
    { id: 'Desserts', name: 'Desserts', emoji: '🍰', color: '#ec4899' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCategoryClick = (category) => {
    // Add user message
    const userMessage = {
      type: 'user',
      text: `Show me ${category.name}`,
      timestamp: new Date()
    };

    // Add bot response
    const botMessage = {
      type: 'bot',
      text: `Great choice! Let me take you to our ${category.name} section 🍽️`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Call the parent component's function to change category
    setTimeout(() => {
      onCategorySelect(category.id);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Process the message and generate response
    const response = processMessage(inputMessage.toLowerCase());
    
    setTimeout(() => {
      setMessages(prev => [...prev, response]);
    }, 500);

    setInputMessage('');
  };

  const processMessage = (message) => {
    // Check for category keywords
    const categoryKeywords = {
      'main course': 'Main Course',
      'main': 'Main Course',
      'indian': 'Indian Food',
      'curry': 'Indian Food',
      'biryani': 'Indian Food',
      'fast food': 'Fast Food',
      'burger': 'Fast Food',
      'pizza': 'Fast Food',
      'seafood': 'Seafood',
      'fish': 'Seafood',
      'shrimp': 'Seafood',
      'appetizer': 'Appetizers',
      'starter': 'Appetizers',
      'salad': 'Salads',
      'soup': 'Soup',
      'beverage': 'Beverages',
      'drink': 'Beverages',
      'dessert': 'Desserts',
      'sweet': 'Desserts'
    };

    // Find matching category
    for (const [keyword, categoryName] of Object.entries(categoryKeywords)) {
      if (message.includes(keyword)) {
        const category = categories.find(cat => cat.name === categoryName);
        if (category) {
          setTimeout(() => {
            onCategorySelect(category.id);
          }, 1500);
          
          return {
            type: 'bot',
            text: `I found ${categoryName} for you! Taking you there now... 🍽️`,
            timestamp: new Date()
          };
        }
      }
    }

    // Check for common questions
    if (message.includes('help') || message.includes('what can you do')) {
      return {
        type: 'bot',
        text: 'I can help you:\n• Browse menu categories\n• Find specific dishes\n• Get recommendations\n• Navigate to different sections\n\nJust click a category below or tell me what you\'re looking for!',
        timestamp: new Date()
      };
    }

    if (message.includes('recommend') || message.includes('popular') || message.includes('best')) {
      return {
        type: 'bot',
        text: 'Our most popular categories are:\n• Main Course - Classic favorites\n• Indian Food - Authentic flavors\n• Seafood - Fresh catches\n\nClick any category below to explore! 🌟',
        timestamp: new Date()
      };
    }

    if (message.includes('price') || message.includes('cost')) {
      return {
        type: 'bot',
        text: 'Our menu offers great value! Prices vary by category and dish. Click on any category to see detailed pricing. 💰',
        timestamp: new Date()
      };
    }

    // Default response
    return {
      type: 'bot',
      text: 'I\'m here to help you explore our menu! You can:\n• Click on any category below\n• Ask about specific dishes\n• Request recommendations\n\nWhat would you like to explore? 🍽️',
      timestamp: new Date()
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container-wrapper">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-toggle-button"
        >
          <MessageCircle size={24} className="chat-icon-desktop" />
          <MessageCircle size={20} className="chat-icon-mobile" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div>
              <h3 className="chat-title">Menu Assistant</h3>
              <p className="chat-subtitle">Here to help you explore</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chat-close-button"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${msg.type === 'user' ? 'user' : 'bot'}`}
              >
                <div className={`message-bubble ${msg.type}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Category Buttons */}
            <div className="category-panel">
              <p className="category-title">Quick Access Categories</p>
              <div className="category-grid">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="category-button"
                    style={{
                      borderColor: `${category.color}40`
                    }}
                  >
                    <span className="category-emoji">{category.emoji}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about our menu..."
              className="chat-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className={`chat-send-button ${inputMessage.trim() ? 'active' : 'disabled'}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chatbot-container-wrapper {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        /* Toggle Button */
        .chat-toggle-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
          transition: all 0.3s ease;
        }

        .chat-toggle-button:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 35px rgba(220, 38, 38, 0.5);
        }

        .chat-icon-mobile {
          display: none;
        }

        /* Chat Window - Desktop */
        .chat-window {
          width: 380px;
          height: 600px;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(220, 38, 38, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        /* Header */
        .chat-header {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .chat-title {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
        }

        .chat-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .chat-close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.3s ease;
        }

        .chat-close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Messages Area */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-wrapper {
          display: flex;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-wrapper.bot {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 75%;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-line;
          color: white;
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border-radius: 18px 18px 4px 18px;
        }

        .message-bubble.bot {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 18px 18px 18px 4px;
        }

        /* Category Panel */
        .category-panel {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .category-title {
          color: #9ca3af;
          font-size: 12px;
          margin: 0 0 12px 0;
          text-align: center;
          font-weight: 500;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .category-button {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .category-button:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .category-emoji {
          font-size: 16px;
        }

        .category-name {
          font-size: 11px;
        }

        /* Input Area */
        .chat-input-area {
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
        }

        .chat-input::placeholder {
          color: rgba(156, 163, 175, 0.7);
        }

        .chat-send-button {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .chat-send-button.active {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          cursor: pointer;
        }

        .chat-send-button.active:hover {
          transform: scale(1.05);
        }

        .chat-send-button.disabled {
          background: rgba(156, 163, 175, 0.3);
          cursor: not-allowed;
        }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.5);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.7);
        }

        /* Animations */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* MOBILE RESPONSIVE - HALF SCREEN */
        @media (max-width: 768px) {
          .chatbot-container-wrapper {
            bottom: 0;
            right: 0;
            left: 0;
          }

          .chat-toggle-button {
            position: fixed;
            bottom: 15px;
            right: 15px;
            width: 56px;
            height: 56px;
            z-index: 1001;
          }

          .chat-icon-desktop {
            display: none;
          }

          .chat-icon-mobile {
            display: block;
          }

          /* HALF SCREEN MOBILE */
          .chat-window {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 50vh; /* HALF SCREEN */
            max-height: 50vh;
            border-radius: 20px 20px 0 0;
            animation: slideUpMobile 0.3s ease-out;
          }

          .chat-header {
            padding: 16px;
          }

          .chat-title {
            font-size: 16px;
          }

          .chat-subtitle {
            font-size: 11px;
          }

          .chat-messages {
            padding: 12px;
            gap: 10px;
          }

          .message-bubble {
            font-size: 13px;
            padding: 10px 14px;
            max-width: 85%;
          }

          .category-panel {
            padding: 12px;
          }

          .category-title {
            font-size: 11px;
            margin-bottom: 10px;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .category-button {
            padding: 8px;
            font-size: 12px;
          }

          .category-emoji {
            font-size: 14px;
          }

          .category-name {
            font-size: 10px;
          }

          .chat-input-area {
            padding: 12px;
          }

          .chat-input {
            padding: 10px 14px;
            font-size: 13px;
          }

          .chat-send-button {
            width: 40px;
            height: 40px;
          }

          @keyframes slideUpMobile {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        /* SMALL MOBILE */
        @media (max-width: 480px) {
          .chat-window {
            height: 50vh; /* Keep half screen */
          }

          .category-grid {
            gap: 5px;
          }

          .category-button {
            padding: 6px;
            gap: 4px;
          }

          .category-name {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default RestaurantChatbot;

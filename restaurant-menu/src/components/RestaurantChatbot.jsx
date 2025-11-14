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
      // Optionally close the chatbot after selection
      // setIsOpen(false);
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
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
          }}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '600px',
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Menu Assistant
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Here to help you explore
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.type === 'user' 
                    ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Category Buttons */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ 
                color: '#9ca3af', 
                fontSize: '12px', 
                margin: '0 0 12px 0',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Quick Access Categories
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${category.color}40`,
                      borderRadius: '10px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${category.color}20`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = category.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = `${category.color}40`;
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{category.emoji}</span>
                    <span style={{ fontSize: '11px' }}>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about our menu..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  background: inputMessage.trim() 
                    ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                    : 'rgba(156, 163, 175, 0.3)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (inputMessage.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.5);
          border-radius: 10px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.7);
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          /* Chat window will adjust */
        }
      `}</style>
    </div>
  );
};

export default RestaurantChatbot;

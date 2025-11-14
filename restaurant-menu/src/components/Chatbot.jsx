import React, { useEffect, useRef, useState } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const messengerRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Load Dialogflow Messenger script
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
    script.async = true;
    document.body.appendChild(script);

    // Create df-messenger element
    script.onload = () => {
      if (messengerRef.current && !messengerRef.current.hasChildNodes()) {
        const dfMessenger = document.createElement('df-messenger');
        dfMessenger.setAttribute('intent', 'WELCOME');
        dfMessenger.setAttribute('chat-title', 'ChatBot');
        dfMessenger.setAttribute('agent-id', 'ecced5a0-7b8f-4be5-a151-ccba076a4c46');
        dfMessenger.setAttribute('language-code', 'en');
        
        // Add mobile-specific attributes
        if (window.innerWidth <= 768) {
          dfMessenger.style.width = '100%';
          dfMessenger.style.height = '100%';
        }
        
        messengerRef.current.appendChild(dfMessenger);
      }
    };

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Chat toggle button */}
      <button 
        className="chatbot-toggle-btn" 
        onClick={toggleChat}
        aria-label="Open chat"
      >
        💬
      </button>

      {/* Overlay for mobile */}
      {isChatOpen && window.innerWidth <= 768 && (
        <div className="chatbot-overlay" onClick={closeChat}></div>
      )}

      {/* Chat container */}
      {isChatOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Restaurant Assistant</h3>
            <button 
              className="chatbot-close-btn" 
              onClick={closeChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="chatbot-iframe-wrapper">
            <div ref={messengerRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

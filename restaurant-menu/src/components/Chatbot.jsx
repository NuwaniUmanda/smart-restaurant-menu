import React, { useEffect, useRef } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const messengerRef = useRef(null);

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

  return <div ref={messengerRef}></div>;
};

export default Chatbot;
import React from "react";

const WelcomePage = ({ onViewMenu }) => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-600 via-black to-red-800 text-white">
    <div className="text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">Smart Restaurant</h1>
      <p className="text-lg md:text-2xl mb-8">Welcome! Scan the QR code to view our delicious menu.</p>
      <button
        onClick={onViewMenu}
        className="bg-white text-red-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-red-50 transition"
      >
        View Menu
      </button>
    </div>
    {/* Floating Chatbot Button Placeholder */}
    <div className="fixed bottom-6 right-6">
      <button className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all">
        {/* Chatbot Icon will go here */}
        <span className="text-2xl">🤖</span>
      </button>
    </div>
  </div>
);

export default WelcomePage; 
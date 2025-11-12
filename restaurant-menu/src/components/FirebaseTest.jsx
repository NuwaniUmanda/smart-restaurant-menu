import React, { useState } from 'react';
import { monitorFirestoreConnection } from '../services/firebase';
import { fetchMenuItems, addMenuItem } from '../services/menuService';

const FirebaseTest = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    
    try {
      await monitorFirestoreConnection();
      setStatus('✅ Connection successful!');
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFetch = async () => {
    setLoading(true);
    setStatus('Testing fetch...');
    
    try {
      const items = await fetchMenuItems();
      setStatus(`✅ Fetch successful! Found ${items.length} items`);
    } catch (error) {
      setStatus(`❌ Fetch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdd = async () => {
    setLoading(true);
    setStatus('Testing add...');
    
    try {
      const testItem = {
        name: "Test Item",
        price: 100,
        image: "🍕",
        description: "Test description",
        tags: ["test"],
        availableAmount: 10,
        available: true,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addMenuItem(testItem);
      setStatus(`✅ Add successful! Item ID: ${docRef.id}`);
    } catch (error) {
      setStatus(`❌ Add failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Firebase Connection Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Connection
        </button>
        
        <button
          onClick={testFetch}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Fetch
        </button>
        
        <button
          onClick={testAdd}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Add Item
        </button>
      </div>
      
      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">{status}</p>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest; 
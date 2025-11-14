import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import Navigation from './components/Navigation';
import POSInterface from './components/POSInterface';
import InventoryManagement from './components/InventoryManagement';
import CustomerManagement from './components/CustomerManagement';
import ReportsPage from './components/ReportsPage';
import './App.css';

const AppContent: React.FC = () => {
  const { state } = usePOS();
  const { currentView } = state.ui;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pos':
        return <POSInterface />;
      case 'inventory':
        return <InventoryManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <POSInterface />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navigation />
      <main className="flex-1">
        {renderCurrentView()}
      </main>
    </div>
  );
};

// Simple Settings Page
const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Store Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <input
                  type="text"
                  defaultValue="Shoe Shop POS"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="8.00"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Receipt Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">Print receipt automatically</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">Email receipt to customer</span>
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Inventory Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  defaultValue="2"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auto-reorder Point</label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}

export default App;

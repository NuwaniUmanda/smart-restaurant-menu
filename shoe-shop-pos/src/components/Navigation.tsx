import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

const Navigation: React.FC = () => {
  const { state, dispatch } = usePOS();
  const { currentView } = state.ui;
  const { currentEmployee } = state;

  const navItems = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (view: typeof currentView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT_EMPLOYEE' });
  };

  return (
    <nav className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Shoe Shop POS</h1>
        {currentEmployee && (
          <div className="mt-2 flex items-center text-sm text-gray-300">
            <User className="w-4 h-4 mr-2" />
            <span>{currentEmployee.name}</span>
            <span className="ml-2 px-2 py-1 bg-blue-600 rounded text-xs">
              {currentEmployee.role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as typeof currentView)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-700 rounded transition-colors text-red-400 hover:text-red-300"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
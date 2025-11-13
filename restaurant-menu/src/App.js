import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { MenuProvider } from './MenuContext';
import { CartProvider } from './CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import MenuPage from './components/MenuPage';
import CartPage from './components/CartPage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Smart Restaurant...</p>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('menu'); // 'menu', 'cart', 'admin-login', 'admin-dashboard'

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth, 
        (currentUser) => {
          console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');
          setUser(currentUser);
          setLoading(false);
          
          // If user is logged in and trying to access admin login, redirect to dashboard
          if (currentUser && currentPage === 'admin-login') {
            setCurrentPage('admin-dashboard');
          }
        },
        (error) => {
          console.error('Auth error:', error);
          setError(error.message);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Firebase setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [currentPage]);

  const handleNavigateToCart = () => {
    setCurrentPage('cart');
  };

  const handleNavigateToMenu = () => {
    setCurrentPage('menu');
  };

  const handleNavigateToAdminLogin = () => {
    if (user) {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('admin-login');
    }
  };

  const handleAdminLogin = () => {
    setCurrentPage('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setCurrentPage('menu');
    setUser(null);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 bg-red-900/20 rounded-lg border border-red-500">
          <h2 className="text-red-500 text-xl font-bold mb-2">Error Loading App</h2>
          <p className="text-white mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MenuProvider>
        <CartProvider>
          <div className="font-sans min-h-screen">
            {currentPage === 'menu' && (
              <MenuPage 
                onCart={handleNavigateToCart}
                onAdmin={handleNavigateToAdminLogin}
              />
            )}
            
            {currentPage === 'cart' && (
              <CartPage onBack={handleNavigateToMenu} />
            )}
            
            {currentPage === 'admin-login' && (
              <AdminLogin onLogin={handleAdminLogin} />
            )}
            
            {currentPage === 'admin-dashboard' && user && (
              <AdminDashboard 
                onLogout={handleAdminLogout}
                onBack={handleNavigateToMenu}  
              />
            )}
            
            {currentPage === 'admin-dashboard' && !user && (
              <AdminLogin onLogin={handleAdminLogin} />
            )}
          </div>
        </CartProvider>
      </MenuProvider>
    </ErrorBoundary>
  );
}

export default App;
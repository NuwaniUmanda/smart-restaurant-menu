import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>👟 Shoe Store POS</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>
        
        <Link to="/sales" className={`nav-item ${isActive('/sales')}`}>
          <span className="nav-icon">💰</span>
          Sales
        </Link>
        
        <Link to="/products" className={`nav-item ${isActive('/products')}`}>
          <span className="nav-icon">👟</span>
          Products
        </Link>
        
        <Link to="/sales-history" className={`nav-item ${isActive('/sales-history')}`}>
          <span className="nav-icon">📋</span>
          Sales History
        </Link>
        
        <Link to="/reports" className={`nav-item ${isActive('/reports')}`}>
          <span className="nav-icon">📈</span>
          Reports
        </Link>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <div>
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
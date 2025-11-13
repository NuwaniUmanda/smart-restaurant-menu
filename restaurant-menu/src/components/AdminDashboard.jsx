import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Save, X, Search, Filter, LogOut, AlertCircle, CheckCircle, Bell, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { useMenu } from '../MenuContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import './admin-dashboard.css';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const AdminDashboard = ({ onLogout, onBack }) => {
const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  
  // FORM STATE - COMPLETE OBJECT
  const [form, setForm] = useState({
    name: '',
    basePrice: '',
    price: '',
    image: '',
    description: '',
    tags: '',
    category: '',
    availableAmount: '',
    hasSizes: false,
    sizeOptions: [
      { name: "Small", price: '', available: true },
      { name: "Medium", price: '', available: true },
      { name: "Large", price: '', available: true }
    ]
  });

  // EXISTING STATES
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const previousOrderCountRef = useRef(0);

  const startAdd = () => {
  setForm({
    name: '',
    basePrice: '',
    price: '',
    image: '',
    description: '',
    tags: '',
    category: '',
    availableAmount: '',
    hasSizes: false,
    sizeOptions: [
      { name: "Small", price: '', available: true },
      { name: "Medium", price: '', available: true },
      { name: "Large", price: '', available: true }
    ]
  });
  setShowAddForm(true);
  setEditingId(null);
};

const startEdit = (item) => {
  setForm({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
    price: item.price || '',
    sizeOptions: item.sizeOptions || [
      { name: "Small", price: '', available: true },
      { name: "Medium", price: '', available: true },
      { name: "Large", price: '', available: true }
    ]
  });
  setEditingId(item.id);
  setShowAddForm(false);
};

const handleChange = (e) => {
  const { name, value, checked, type } = e.target;
  setForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};

const handleSizeOptionChange = (index, field, value) => {
  const newSizeOptions = [...form.sizeOptions];
  newSizeOptions[index] = { ...newSizeOptions[index], [field]: value };
  setForm(prev => ({ ...prev, sizeOptions: newSizeOptions }));
};

const removeSizeOption = (index) => {
  setForm(prev => ({
    ...prev,
    sizeOptions: prev.sizeOptions.filter((_, i) => i !== index)
  }));
};

const addSizeOption = () => {
  setForm(prev => ({
    ...prev,
    sizeOptions: [...prev.sizeOptions, { name: '', price: '', available: true }]
  }));
};

const handleAdd = async () => {
  if (!form.name || (form.hasSizes ? !form.sizeOptions.some(s => s.price) : !form.price)) {
    setError('Please fill in required fields');
    return;
  }

  setLoading(true);
  try {
    const newItem = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      price: form.hasSizes ? null : parseFloat(form.price),
      availableAmount: parseInt(form.availableAmount) || 0
    };

    addMenuItem(newItem);
    showSuccessMessage('Item added successfully!');
    cancelForm();
  } catch (error) {
    setError('Failed to add item: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleEdit = async (itemId) => {
  if (!form.name || (form.hasSizes ? !form.sizeOptions.some(s => s.price) : !form.price)) {
    setError('Please fill in required fields');
    return;
  }

  setLoading(true);
  try {
    const updatedItem = {
      ...form,
      id: itemId,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      price: form.hasSizes ? null : parseFloat(form.price),
      availableAmount: parseInt(form.availableAmount) || 0
    };

    updateMenuItem(itemId, updatedItem);
    showSuccessMessage('Item updated successfully!');
    cancelForm();
  } catch (error) {
    setError('Failed to update item: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (itemId) => {
  if (!window.confirm('Are you sure you want to delete this item?')) return;

  setLoading(true);
  try {
    deleteMenuItem(itemId);
    showSuccessMessage('Item deleted successfully!');
  } catch (error) {
    setError('Failed to delete item: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const cancelForm = () => {
  setShowAddForm(false);
  setEditingId(null);
  setError('');
};

const getDisplayPrice = (item) => {
  if (item.hasSizes && item.sizeOptions) {
    const prices = item.sizeOptions.filter(s => s.available).map(s => parseFloat(s.price || 0));
    if (prices.length === 0) return 'N/A';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `LKR ${min.toFixed(2)}` : `LKR ${min.toFixed(2)} - ${max.toFixed(2)}`;
  }
  return `LKR ${parseFloat(item.price || 0).toFixed(2)}`;
};

const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

  // Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

// FIRESTORE REAL-TIME LISTENER - Listen to pending orders
useEffect(() => {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders = [];
    
    snapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        orderId: doc.id,
        notificationId: doc.id,
        tableNumber: orderData.tableNumber,
        customerName: orderData.customerName,
        items: orderData.items,
        itemCount: orderData.items.reduce((sum, item) => sum + item.qty, 0),
        total: orderData.subtotal,
        status: orderData.status,
        createdAt: new Date(orderData.createdAt).toLocaleString(),
        timestamp: new Date(orderData.createdAt).getTime()
      });
    });
    
    // Play sound only when NEW orders arrive
    if (orders.length > previousOrderCountRef.current && previousOrderCountRef.current >= 0) {
      playNotificationSound();
    }
    
    // Update the ref with current count
    previousOrderCountRef.current = orders.length;
    
    setNotifications(orders);
    setIsConnected(true);
    console.log('Loaded pending orders from Firestore:', orders.length);
  }, (error) => {
    console.error('Error listening to orders:', error);
    setIsConnected(false);
  });

  return () => unsubscribe();
}, []);

const handleCompleteOrder = async (orderId, paymentMethod = 'cash') => {
  try {
    const response = await fetch(`http://localhost:4000/api/orders/${orderId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentStatus: 'completed',
        paymentMethod: paymentMethod 
      })
    });
    
    if (response.ok) {
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      // Add to history
      const order = await response.json();
      setOrderHistory(prev => [order, ...prev]);
      showSuccessMessage('Order completed and payment recorded!');
    }
  } catch (error) {
    setError('Failed to complete order');
  }
};

  // Update Unread Count
  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const handleConfirmOrder = async (orderId, notificationId) => {
  try {
    // Update order status in Firestore
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString()
    });

    showSuccessMessage('Order confirmed and ready!');
    
    // The Firestore listener will automatically update the UI
  } catch (error) {
    console.error('Error confirming order:', error);
    setError('Failed to confirm order');
  }
};

  // EXISTING FUNCTIONS (around line 286)
const normalizeCategory = (cat) => {
  if (!cat) return '';
  return cat.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const categories = ['All', ...new Set(
  menu
    .map(item => normalizeCategory(item.category))
    .filter(Boolean)
)].sort();

const allTags = ['All', ...new Set(menu.flatMap(item => Array.isArray(item.tags) ? item.tags : []))];

const filteredMenu = menu.filter(item => {
  const matchesSearch = !searchTerm || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(item.tags) && item.tags.some(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  const matchesCategory = selectedCategory === 'All' || 
    normalizeCategory(item.category) === selectedCategory;
  const matchesTag = selectedTag === 'All' || (Array.isArray(item.tags) && item.tags.includes(selectedTag));
  return matchesSearch && matchesCategory && matchesTag;
});

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header*/}
    <div className="header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(17, 24, 39, 0.98)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      paddingBottom: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h1>Admin Dashboard</h1>
          <p>Manage your restaurant menu</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button 
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              background: 'rgba(75, 85, 99, 0.3)',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              borderRadius: '10px',
              color: '#d1d5db',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="btn-text">Back to Menu</span>
          </button>

          <button 
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={16} />
            <span className="btn-text">Notifications</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button 
            onClick={handleLogout} 
            className="logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}
          >
            <LogOut size={16} />
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Search Bar and Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ 
              width: '100%',
              padding: '10px 36px 10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '13px',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#dc2626';
              e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '10px', color: '#9ca3af' }} />
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="filter-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '10px 14px',
            backgroundColor: 'rgba(75, 85, 99, 0.3)',
            border: '1px solid rgba(156, 163, 175, 0.3)',
            borderRadius: '10px',
            color: '#d1d5db',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            whiteSpace: 'nowrap',
            fontSize: '13px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 85, 99, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Filter size={14} />
          <span className="btn-text">Filters</span>
        </button>
    
    <button 
      onClick={startAdd} 
      className="add-btn"
      style={{ 
        backgroundColor: 'linear-gradient(135deg, #dc2626, #991b1b)',
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        padding: '10px 14px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        fontSize: '13px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Plus size={14} />
      <span className="btn-text">Add Item</span>
    </button>
  </div>
</div>
      
      {/* FIXED NOTIFICATION PANEL with Confirm Button */}
      {showNotificationPanel && (
        <div className="notification-panel">
          <div className="panel-header">
            <div>
              <h3>Pending Orders</h3>
              <div className="connection-status">
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
                {isConnected ? 'Connected to Firestore' : 'Connecting...'}
              </div>
            </div>
            <button onClick={() => setShowNotificationPanel(false)}>✕</button>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                {isConnected ? 'No pending orders' : 'Connecting...'}
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.orderId} className="notification-card">
                  <div className="notif-header">
                    <div>
                      <h4>Table {notif.tableNumber || 'N/A'}</h4>
                      <p>Order: {notif.orderId.slice(0, 8)}...</p>
                    </div>
                    <span className="pending-badge">Pending</span>
                  </div>

                  <div className="notif-items">
                    {notif.items && notif.items.map((item, idx) => (
                      <div key={idx} className="notif-item">
                        <span>{item.name} x{item.qty}</span>
                        <span>LKR {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="notif-total">
                    <span>Total</span>
                    <span>LKR {notif.total?.toFixed(2) || '0.00'}</span>
                  </div>

                  <div className="notif-actions">
                    <button
                      onClick={() => handleConfirmOrder(notif.orderId)}
                      className="confirm-btn"
                    >
                      <CheckCircle size={16} />
                      Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(220, 38, 38, 0.1)', 
          border: '1px solid #dc2626',
          color: '#f87171',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '16px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          border: '1px solid #22c55e',
          color: '#34d399',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '16px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Filter Panel */}
      <div className={`filter-panel ${showFilters ? 'active' : ''}`} style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: showFilters ? '16px' : '0',
        marginBottom: showFilters ? '20px' : '0',
        marginTop: '20px', // Add this line for spacing from sticky header
        maxHeight: showFilters ? '200px' : '0',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)} 
              className="filter-select"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {categories.map(cat => <option key={cat} value={cat} style={{backgroundColor: '#2d3748'}}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Tags</label>
            <select 
              value={selectedTag} 
              onChange={(e) => setSelectedTag(e.target.value)} 
              className="filter-select"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {allTags.map(tag => <option key={tag} value={tag} style={{backgroundColor: '#2d3748'}}>{tag}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Menu List */}
<div className="menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
  {filteredMenu.map(item => (
    <div key={item.id} className="menu-item" style={{
      display: 'flex',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }}
    >
      {/* CHANGE THIS: Remove inline width/height and use className instead */}
      <div className="image-container">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',  
              transition: 'transform 0.3s ease'
            }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(74, 85, 104, 0.3)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#a0aec0',
            fontSize: '14px'
          }}>
            No Image
          </div>
        )}
      </div>
      
            <div className="content" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>{item.name}</h3>
                  <div className="price" style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#dc2626',
                    marginTop: '4px'
                  }}>
                    {getDisplayPrice(item)}
                  </div>
                  {item.hasSizes && (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#34d399',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        Multiple Sizes
                      </span>
                    </div>
                  )}
                </div>
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => startEdit(item)} 
                    className="action-btn edit" 
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(75, 85, 99, 0.3)',
                      border: '1px solid rgba(156, 163, 175, 0.3)',
                      borderRadius: '8px',
                      color: '#d1d5db',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(75, 85, 99, 0.3)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="action-btn delete" 
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      borderRadius: '8px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              
              {item.description && (
                <p style={{ margin: 0, color: '#a0aec0', fontSize: '14px', lineHeight: '1.5' }}>
                  {item.description}
                </p>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {item.category && (
                    <span className="category-tag" style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(75, 85, 99, 0.3)',
                      color: '#d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {item.category}
                    </span>
                  )}
                  <span className={`stock-tag ${item.availableAmount < 5 ? 'low' : ''}`} style={{
                    padding: '4px 8px',
                    backgroundColor: item.availableAmount < 5 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(75, 85, 99, 0.3)',
                    color: item.availableAmount < 5 ? '#dc2626' : '#d1d5db',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Stock: {item.availableAmount}
                  </span>
                </div>
              </div>
              
              {item.tags && item.tags.length > 0 && (
                <div className="tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {item.tags.map((tag, index) => (
                    <span key={index} className="tag" style={{
                      padding: '2px 6px',
                      backgroundColor: 'rgba(156, 163, 175, 0.2)',
                      color: '#9ca3af',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Display size options if available */}
              {item.hasSizes && item.sizeOptions && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ color: '#a0aec0', fontSize: '12px', margin: '0 0 4px 0' }}>Available sizes:</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.sizeOptions.filter(size => size.available).map((size, index) => (
                      <span key={index} style={{
                        padding: '2px 6px',
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                        color: '#dc2626',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {size.name}: LKR {size.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredMenu.length === 0 && (
        <div className="no-results" style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#a0aec0'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No menu items found</h3>
          <p style={{ fontSize: '14px' }}>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Form Modal */}
      {(editingId || showAddForm) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="form-container" style={{ 
            width: '500px', 
            maxWidth: '90vw', 
            maxHeight: '90vh', 
            overflow: 'auto',
            backgroundColor: 'rgba(45, 55, 72, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(20px)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              color: 'white',
              textAlign: 'center'
            }}>
              {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Name *</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Enter item name" 
                className="form-input"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Size Options Toggle */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aec0', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="hasSizes"
                  checked={form.hasSizes}
                  onChange={handleChange}
                  disabled={loading}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#dc2626'
                  }}
                />
                This item has different sizes (Small, Medium, Large)
              </label>
            </div>

            {/* Conditional Price Fields */}
            {form.hasSizes ? (
              <>
                {/* Size Options Configuration - Manual Pricing */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Size Options *</label>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '8px', 
                    padding: '12px' 
                  }}>
                    {form.sizeOptions.map((option, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => handleSizeOptionChange(index, 'name', e.target.value)}
                          placeholder="Size name (e.g., Small)"
                          disabled={loading}
                          style={{
                            flex: '1',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px'
                          }}
                        />
                        <span style={{ color: '#a0aec0', fontSize: '13px', minWidth: '30px' }}>LKR</span>
                        <input
                          type="number"
                          step="0.01"
                          value={option.price}
                          onChange={(e) => handleSizeOptionChange(index, 'price', e.target.value)}
                          placeholder="0.00"
                          disabled={loading}
                          style={{
                            width: '100px',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px'
                          }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a0aec0', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={option.available}
                            onChange={(e) => handleSizeOptionChange(index, 'available', e.target.checked)}
                            disabled={loading}
                            style={{
                              width: '14px',
                              height: '14px',
                              accentColor: '#dc2626'
                            }}
                          />
                          Available
                        </label>
                        {form.sizeOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeOption(index)}
                            disabled={loading}
                            style={{
                              padding: '6px 8px',
                              backgroundColor: 'rgba(220, 38, 38, 0.2)',
                              border: '1px solid rgba(220, 38, 38, 0.3)',
                              borderRadius: '4px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSizeOption}
                      disabled={loading}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '6px',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginTop: '8px',
                        width: '100%'
                      }}
                    >
                      + Add Size Option
                    </button>
                  </div>
                  <small style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Set individual prices for each size. Uncheck "Available" to hide specific sizes from customers.
                  </small>
                </div>
              </>
            ) : (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Price (LKR) *</label>
                <input 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  value={form.price} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  className="form-input"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Image URL</label>
              <input 
                name="image" 
                value={form.image} 
                onChange={handleChange} 
                placeholder="https://example.com/image.jpg" 
                className="form-input"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Describe your menu item..." 
                className="form-textarea"
                rows="3"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Category</label>
              <input 
                name="category" 
                value={form.category} 
                onChange={handleChange} 
                placeholder="e.g., Pizza, Salads, Sandwiches" 
                className="form-input"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Tags (comma separated)</label>
              <input 
                name="tags" 
                value={form.tags} 
                onChange={handleChange} 
                placeholder="e.g., vegetarian, spicy, popular" 
                className="form-input"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0aec0', fontSize: '14px' }}>Available Amount</label>
              <input 
                name="availableAmount" 
                type="number" 
                value={form.availableAmount} 
                onChange={handleChange} 
                placeholder="0" 
                className="form-input"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={cancelForm} 
                className="form-btn cancel"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: 'rgba(75, 85, 99, 0.3)',
                  border: '1px solid rgba(156, 163, 175, 0.3)',
                  borderRadius: '8px',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(75, 85, 99, 0.5)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(75, 85, 99, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={() => (editingId ? handleEdit(editingId) : handleAdd())} 
                className="form-btn save"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Save size={16} /> 
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Add Item')}
              </button>
            </div>
          </div>
        </div>
      )}

    <style>{`
  .notification-panel {
    position: fixed;
    top: 100px;
    right: 24px;
    width: 500px;
    max-height: 75vh;
    background-color: rgba(30, 30, 30, 0.98);
    border: 2px solid #dc2626;
    border-radius: 16px;
    padding: 20px;
    z-index: 9998;
    box-shadow: 0 20px 60px rgba(220, 38, 38, 0.4);
    backdrop-filter: blur(20px);
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 12px;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .status-dot.connected {
    background-color: #22c55e;
  }

  .status-dot.disconnected {
    background-color: #ef4444;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notification-card {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 12px;
    padding: 16px;
  }

  .notif-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .pending-badge {
    background-color: rgba(220, 38, 38, 0.2);
    color: #dc2626;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .notif-items {
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    max-height: 120px;
    overflow-y: auto;
  }

  .notif-item {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #e5e7eb;
    margin-bottom: 4px;
  }

  .notif-total {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: bold;
    color: #dc2626;
  }

  .notif-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .confirm-btn {
    flex: 1;
    padding: 10px 16px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .confirm-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  }

  .header button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: rgba(75, 85, 99, 0.3);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 10px;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.header button:hover {
  background-color: rgba(75, 85, 99, 0.5);
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.header button .badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.logout-btn {
  background: linear-gradient(135deg, #dc2626, #991b1b) !important;
  border: none !important;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #991b1b, #7f1d1d) !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4) !important;
}

.image-container {
  width: 200px;
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .image-container {
    width: 120px;
    height: 120px;
  }
}

@media (max-width: 480px) {
  .image-container {
    width: 100px;
    height: 100px;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .header h1 {
    font-size: 20px !important;
  }
  
  .header p {
    font-size: 12px !important;
  }
  
  .btn-text {
    display: none;
  }
  
  .header button {
    padding: 8px !important;
    min-width: 36px;
    justify-content: center;
  }
  
  .menu-item {
    flex-direction: column !important;
  }
  
  .image-container {
    width: 100% !important;
    height: 160px !important;
  }
}

@media (max-width: 480px) {
  .header {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  
  .filter-panel {
    grid-template-columns: 1fr !important;
  }
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 14px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`}</style>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Bell, X, Clock, CheckCircle } from 'lucide-react';
import config from '../config';

const AdminNotifications = ({ adminId = 'admin1' }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // FETCH NOTIFICATIONS FROM DATABASE ON MOUNT
  useEffect(() => {
    fetchNotificationsFromDB();
  }, []);

  const fetchNotificationsFromDB = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/notifications/admin`);
      if (response.ok) {
        const data = await response.json();
        // Format the data to match expected format
        const formattedNotifications = data.map(notif => ({
          orderId: notif.orderId,
          notificationId: notif.id,
          tableNumber: notif.tableNumber,
          customerName: notif.customerName,
          items: notif.items,
          itemCount: notif.itemCount,
          total: notif.total,
          status: notif.status,
          createdAt: new Date(notif.createdAt).toLocaleString(),
          timestamp: notif.timestamp
        }));
        setNotifications(formattedNotifications);
        console.log('Loaded notifications from database:', formattedNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications from DB:', error);
    }
  };

  const handleConfirmOrder = async (orderId, notificationId) => {
    try {
      // Only mark as read in database when explicitly confirmed
      if (notificationId) {
        await fetch(`${config.API_BASE_URL}/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('order_confirmed', orderId);
      }

      // Remove from UI
      removeNotification(orderId);
    } catch (error) {
      console.error('Error confirming order:', error);
    }
  };

  useEffect(() => {
    socketRef.current = io(config.API_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      socketRef.current.emit('join_admin', adminId);
    });

    socketRef.current.on('new_order', (orderData) => {
      console.log('New order received:', orderData);
      addNotification(orderData);
      playNotificationSound();
      showBrowserNotification(orderData);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [adminId]);

  const addNotification = (orderData) => {
    // Avoid duplicates
    setNotifications(prev => {
      const exists = prev.some(n => n.orderId === orderData.orderId);
      if (exists) return prev;
      return [orderData, ...prev];
    });
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

  const showBrowserNotification = (orderData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = `🔔 New Order - Table ${orderData.tableNumber || 'N/A'}`;
      const options = {
        body: `${orderData.itemCount} items • LKR ${orderData.total.toFixed(2)}\nCustomer: ${orderData.customerName}`,
        icon: '🔔',
        badge: '🔔',
        tag: `order-${orderData.orderId}`,
        requireInteraction: true
      };
      new Notification(title, options);
    }
  };

  const removeNotification = (orderId) => {
    setNotifications(prev => prev.filter(notif => notif.orderId !== orderId));
  };

  // Remove notification from UI only (don't mark as read)
  const dismissNotification = (orderId) => {
    removeNotification(orderId);
  };

  const clearAllNotifications = async () => {
    try {
      // Mark all as read in database
      await fetch(`${config.API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      // Clear from UI
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Clear from UI anyway
      setNotifications([]);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      width: '420px',
      maxHeight: '90vh',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    }}>
      {/* Connection Status Badge */}
      <div style={{
        pointerEvents: 'auto',
        padding: '10px 16px',
        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#22c55e' : '#ef4444',
          animation: isConnected ? 'pulse 2s infinite' : 'none'
        }}></div>
        {isConnected ? 'Connected to Server' : 'Disconnected'}
      </div>

      {/* Notifications List */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: 'calc(90vh - 60px)',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#9ca3af',
            textAlign: 'center',
            fontSize: '14px',
            backdropFilter: 'blur(10px)'
          }}>
            No pending orders
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.orderId}
              style={{
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                border: '2px solid #dc2626',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
                animation: 'slideIn 0.3s ease-out',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated border glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #dc2626, #991b1b, #dc2626)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }}></div>

              <div style={{ paddingTop: '4px' }}>
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#dc2626',
                      marginBottom: '4px'
                    }}>
                      Table {notification.tableNumber || 'N/A'}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} />
                      {notification.createdAt}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.orderId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                      e.target.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#9ca3af';
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Customer Info */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    color: '#e5e7eb',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>
                    {notification.customerName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    Order ID: {notification.orderId.slice(0, 8)}...
                  </div>
                </div>

                {/* Items List */}
                <div style={{
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Items ({notification.itemCount})
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {notification.items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '13px'
                        }}
                      >
                        <div>
                          <span style={{ color: '#e5e7eb', fontWeight: '500' }}>
                            {item.name}
                          </span>
                          {item.selectedSize && (
                            <span style={{
                              marginLeft: '6px',
                              color: '#9ca3af',
                              fontSize: '11px'
                            }}>
                              ({item.selectedSize.name})
                            </span>
                          )}
                          <span style={{
                            marginLeft: '6px',
                            color: '#9ca3af'
                          }}>
                            × {item.qty}
                          </span>
                        </div>
                        <span style={{
                          color: '#dc2626',
                          fontWeight: '600'
                        }}>
                          LKR {(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total and Action Button */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Total Amount
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#dc2626'
                      }}>
                        LKR {notification.total.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      borderRadius: '6px',
                      color: '#dc2626',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {notification.status || 'Pending'}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={() => handleConfirmOrder(notification.orderId, notification.notificationId)}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <CheckCircle size={16} />
                    Done
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear All Button */}
      {notifications.length > 0 && (
        <button
          onClick={clearAllNotifications}
          style={{
            pointerEvents: 'auto',
            padding: '10px 16px',
            backgroundColor: 'rgba(75, 85, 99, 0.3)',
            border: '1px solid rgba(156, 163, 175, 0.3)',
            borderRadius: '8px',
            color: '#d1d5db',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
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
          Clear All Notifications
        </button>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(220, 38, 38, 0.3);
          border-radius: 10px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 38, 38, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdminNotifications;
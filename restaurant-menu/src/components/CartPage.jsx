import React, { useState } from "react";
import { useCart } from '../CartContext';

const backgroundUrl = "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80";
const suitPattern = `data:image/svg+xml;utf8,<svg width='400' height='400' viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='200' cy='200' rx='180' ry='120' fill='white' fill-opacity='0.13'/><ellipse cx='300' cy='320' rx='60' ry='40' fill='white' fill-opacity='0.09'/><ellipse cx='100' cy='350' rx='50' ry='30' fill='white' fill-opacity='0.07'/></svg>`;

const CartPage = ({ onBack }) => {
  // Get cart data and functions from CartContext
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    createOrder, 
    getCartTotal, 
    getCartItemCount,
    loading,
    error 
  } = useCart();

  // Local state for UI and order history
  const [activeId, setActiveId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showTableNumberModal, setShowTableNumberModal] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Calculate total (no discount)
  const totalAmount = getCartTotal();

  // Get table number from cart items (they should all have the same table number)
  const tableNumber = cart.length > 0 ? cart[0].tableNumber : null;

  const handleQtyChange = async (id, delta) => {
    try {
      setActiveId(id);
      await updateQuantity(id, delta);
      setTimeout(() => setActiveId(null), 400);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setActiveId(null);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeFromCart(id);
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleConfirmOrder = async () => {
  // Check if table number is set
  if (!tableNumber) {
    setShowTableNumberModal(true);
    return;
  }

  try {
    setOrderLoading(true);
    
    // Store current cart items for order history before clearing
    const orderItems = [...cart];
    const orderTotal = totalAmount;
    const orderTableNumber = tableNumber;
    
    // Simple order details - you can add a form for this later
    const orderDetails = {
      customerName: "Guest User", 
      customerEmail: "guest@example.com",
      customerPhone: "",
      deliveryAddress: "",
      paymentMethod: "cash",
      tableNumber: orderTableNumber
    };

    const order = await createOrder(orderDetails);
    
    // Add to order history
    const newOrder = {
      id: Date.now(), 
      date: new Date().toLocaleString(),
      items: orderItems,
      total: orderTotal,
      status: "Pending",
      tableNumber: orderTableNumber,
      ...orderDetails
    };
    
    setOrderHistory(prev => [newOrder, ...prev]);
    setShowOrderHistory(true);
    
    alert('Order placed successfully! Check your order history below.');
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Failed to place order. Please try again.');
  } finally {
    setOrderLoading(false);
  }
};

const handleConfirmOrderWithTableNumber = async (tableNum) => {
  try {
    setOrderLoading(true);
    
    // Store current cart items for order history before clearing
    const orderItems = [...cart];
    const orderTotal = totalAmount;
    
    // Simple order details - you can add a form for this later
    const orderDetails = {
      customerName: "Guest User", 
      customerEmail: "guest@example.com",
      customerPhone: "",
      deliveryAddress: "",
      paymentMethod: "cash",
      tableNumber: tableNum
    };

    const order = await createOrder(orderDetails);
    
    // Add to order history
    const newOrder = {
      id: Date.now(), 
      date: new Date().toLocaleString(),
      items: orderItems,
      total: orderTotal,
      status: "Confirmed",
      tableNumber: tableNum,
      ...orderDetails
    };
    
    setOrderHistory(prev => [newOrder, ...prev]);
    setShowOrderHistory(true);
    
    alert('Order placed successfully! Check your order history below.');
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Failed to place order. Please try again.');
  } finally {
    setOrderLoading(false);
  }
};

const [showPaymentModal, setShowPaymentModal] = useState(false);

const handleCheckoutWithPayment = async (paymentMethod) => {
  try {
    setOrderLoading(true);
    await handleConfirmOrder();
    // Payment will be marked in the order
    setShowPaymentModal(false);
  } finally {
    setOrderLoading(false);
  }
};

const handleSetTableNumber = async () => {
  if (!tableNumberInput || tableNumberInput.trim() === '') {
    alert('Please enter your table number');
    return;
  }

  const tableNum = parseInt(tableNumberInput.trim());
  if (isNaN(tableNum) || tableNum <= 0) {
    alert('Please enter a valid table number');
    return;
  }

  setIsSubmittingTable(true);
  try {
    // Import setTableNumber from cartService at the top of the file
    const { setTableNumber } = await import('../services/cartService');
    setTableNumber(tableNum);
    setTableNumberInput('');
    setShowTableNumberModal(false);
    
    // Now proceed with the order using the tableNum we just set
    await handleConfirmOrderWithTableNumber(tableNum);
  } catch (error) {
    console.error('Error setting table number:', error);
    alert('Failed to set table number. Please try again.');
  } finally {
    setIsSubmittingTable(false);
  }
};

  // Show loading state
  if (loading && cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading cart...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(220, 38, 38, 0.15) 0%, rgba(0, 0, 0, 0.25) 100%), url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.85)',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-0"></div>
      
      {/* SVG Pattern Overlay */}
      <div
        className="pointer-events-none absolute z-10"
        style={{
          bottom: 0,
          right: 0,
          width: '500px',
          height: '500px',
          backgroundImage: `url('${suitPattern}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          opacity: 0.3,
        }}
      ></div>

      {/* Header Section */}
      <header className="relative z-20 bg-black bg-opacity-95 backdrop-blur-sm border-b border-red-600 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 lg:gap-20 w-full sm:w-auto">
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: 'rgba(252, 252, 252, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back to Menu</span>
              <span className="sm:hidden">Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0,
                  background: 'linear-gradient(135deg,rgb(197, 46, 46) 0%,rgb(183, 31, 31) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
                className="sm:text-2xl lg:text-3xl">
                  Smart Restaurant
                </h1>
                <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '12px' }} className="sm:text-sm">
                  Delicious food, smart ordering
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Order History Button */}
          <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto justify-end">
            {orderHistory.length > 0 && (
              <button
                onClick={() => setShowOrderHistory(!showOrderHistory)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">{showOrderHistory ? 'Hide' : 'Show'} Order History</span>
                <span className="sm:hidden">{showOrderHistory ? 'Hide' : 'Show'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Order History Section */}
        {showOrderHistory && orderHistory.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-red-900 via-black to-red-800 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-red-600">
            <h2 className="text-2xl font-bold text-white mb-6">Order History</h2>
            
            <div className="space-y-4">
              {orderHistory.map(order => (
                <div key={order.id} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">Order #{order.id}</h3>
                      <p className="text-gray-400 text-sm">{order.date}</p>
                      {order.tableNumber && (
                        <p className="text-red-400 text-sm font-semibold">Table {order.tableNumber}</p>
                      )}
                      <span className="inline-block bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium mt-1">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="font-bold text-red-400 text-xl">LKR {order.total.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-gray-300 text-sm mb-2">Items ordered:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.items.map(item => (
                        <div key={`${order.id}-${item.id}`} className="bg-gray-700 rounded-lg p-2">
                          <span className="text-white text-sm">
                            {item.name} x{item.qty}
                          </span>
                          <span className="text-red-400 text-xs block font-semibold">LKR {(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty cart" className="w-24 h-24 mb-4 opacity-80" />
            <div className="text-xl font-semibold text-white mb-2">Your cart is empty</div>
            <div className="text-gray-300 mb-4">Add some delicious items to get started!</div>
            <button 
              onClick={onBack}
              style={{
                background: 'linear-gradient(135deg,rgb(177, 19, 19),rgb(136, 26, 26))',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Product List (Left Side - 70% Width) */}
            <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-800 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-red-600">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Shopping Cart ({getCartItemCount()} items)</h2>
              </div>
              
              <div className="space-y-4">
                {cart.map(item => (
                  <div
                    key={item.uniqueItemId || item.id}
                    className={`rounded-2xl p-4 shadow-sm transition-all duration-300 border border-gray-700 ${
                      activeId === item.id 
                        ? 'ring-2 ring-red-500 bg-gradient-to-r from-red-900 to-red-800' 
                        : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:shadow-md hover:border-red-500'
                    }`}
                  >
                  
                    <div className="flex items-start gap-3 sm:gap-4">
                      
                      {/* Product Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-2xl sm:text-3xl">🍽</span>
                          )}
                        </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg mb-1">
                          {item.name}
                        </h3>
                        
                        {/* Size information */}
                        {item.selectedSize && (
                          <div className="mb-2">
                            <span className="inline-block bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              Size: {item.selectedSize.name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQtyChange(item.id, -1)}
                                disabled={item.qty <= 1 || loading}
                                className={`w-8 h-8 flex items-center justify-center rounded-full border border-red-600 bg-gray-800 text-red-400 font-bold shadow hover:bg-red-900 transition-all ${
                                  item.qty <= 1 || loading ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'
                                }`}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="font-semibold text-white text-lg px-3 min-w-[2rem] text-center">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => handleQtyChange(item.id, 1)}
                                disabled={loading}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-red-600 bg-gray-800 text-red-400 font-bold shadow hover:bg-red-900 transition-all hover:scale-110 disabled:opacity-50"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Remove Button */}
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={loading}
                              className="text-gray-400 hover:text-red-400 p-2 rounded-full transition-colors disabled:opacity-50"
                              aria-label="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-red-400 text-lg">
                              LKR {(item.price * item.qty).toFixed(2)}
                            </div>
                            <div className="text-sm text-red-300">
                              LKR {item.price.toFixed(2)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-80 bg-gradient-to-br from-gray-900 via-black to-gray-800 backdrop-blur-sm rounded-3xl shadow-xl p-6 h-fit border border-red-600">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              {/* Table Number Display */}
              {tableNumber && (
                <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded-xl">
                  <div className="flex items-center justify-center">
                    <span className="text-red-400 font-semibold text-lg">Table {tableNumber}</span>
                  </div>
                </div>
              )}
              
              {/* Order Breakdown - No Discount */}
              <div className="space-y-3 mb-6 bg-gray-800 bg-opacity-70 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({getCartItemCount()} items)</span>
                  <span className="text-red-400 font-semibold">LKR {totalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-lg">Total</span>
                    <span className="font-bold text-red-400 text-2xl">LKR {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button - Red styled */}
              <button
                onClick={handleConfirmOrder}
                disabled={loading || orderLoading || cart.length === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg,rgb(182, 39, 39), #991b1b)',
                  color: 'white',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {orderLoading ? 'Placing Order...' : 'Confirm Order'}
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-3">
                Secure checkout • {tableNumber && `Table ${tableNumber} • `}Order total: <span className="text-red-400 font-semibold">LKR {totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Table Number Modal */}
{showTableNumberModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-3xl p-6 max-w-md w-full border border-red-600 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Table Number Required</h3>
        <button
          onClick={() => setShowTableNumberModal(false)}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={isSubmittingTable}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-300 mb-4">
          Please enter your table number to complete your order.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Table Number <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={tableNumberInput}
            onChange={(e) => setTableNumberInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSetTableNumber()}
            placeholder="Enter your table number"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20"
            min="1"
            max="999"
            disabled={isSubmittingTable}
            autoFocus
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowTableNumberModal(false)}
          disabled={isSubmittingTable}
          className="flex-1 py-3 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSetTableNumber}
          disabled={isSubmittingTable || !tableNumberInput.trim()}
          className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmittingTable ? 'Setting...' : 'Continue Order'}
        </button>
      </div>
    </div>
  </div>
)}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s; }
        
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0.05; }
          5%, 85% { opacity: 0.15; }
          10%, 80% { opacity: 0.05; }
          15%, 75% { opacity: 0.2; }
          20%, 70% { opacity: 0.05; }
          25%, 65% { opacity: 0.25; }
          30%, 60% { opacity: 0.05; }
          35%, 55% { opacity: 0.3; }
          40%, 50% { opacity: 0.05; }
          45% { opacity: 0.35; }
        }
        
        .lightning-effect {
          animation: lightning 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CartPage;
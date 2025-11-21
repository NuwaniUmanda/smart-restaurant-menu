import React, { useState } from "react";
import { useCart } from '../CartContext';

const backgroundUrl = "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80";
const suitPattern = `data:image/svg+xml;utf8,<svg width='400' height='400' viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='200' cy='200' rx='180' ry='120' fill='white' fill-opacity='0.13'/><ellipse cx='300' cy='320' rx='60' ry='40' fill='white' fill-opacity='0.09'/><ellipse cx='100' cy='350' rx='50' ry='30' fill='white' fill-opacity='0.07'/></svg>`;

const CartPage = ({ onBack }) => {
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

  const [activeId, setActiveId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showTableNumberModal, setShowTableNumberModal] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const totalAmount = getCartTotal();
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
    if (!tableNumber) {
      setShowTableNumberModal(true);
      return;
    }

    try {
      setOrderLoading(true);
      const orderItems = [...cart];
      const orderTotal = totalAmount;
      const orderTableNumber = tableNumber;
      
      const orderDetails = {
        customerName: "Guest User", 
        customerEmail: "guest@example.com",
        customerPhone: "",
        deliveryAddress: "",
        paymentMethod: "cash",
        tableNumber: orderTableNumber
      };

      const order = await createOrder(orderDetails);
      
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
      const orderItems = [...cart];
      const orderTotal = totalAmount;
      
      const orderDetails = {
        customerName: "Guest User", 
        customerEmail: "guest@example.com",
        customerPhone: "",
        deliveryAddress: "",
        paymentMethod: "cash",
        tableNumber: tableNum
      };

      const order = await createOrder(orderDetails);
      
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
      const { setTableNumber } = await import('../services/cartService');
      setTableNumber(tableNum);
      setTableNumberInput('');
      setShowTableNumberModal(false);
      await handleConfirmOrderWithTableNumber(tableNum);
    } catch (error) {
      console.error('Error setting table number:', error);
      alert('Failed to set table number. Please try again.');
    } finally {
      setIsSubmittingTable(false);
    }
  };

  if (loading && cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(220, 38, 38, 0.15) 0%, rgba(0, 0, 0, 0.25) 100%), url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.85)',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-0"></div>
      
      <div
        className="pointer-events-none absolute z-10 hidden md:block"
        style={{
          bottom: 0,
          right: 0,
          width: '400px',
          height: '400px',
          backgroundImage: `url('${suitPattern}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          opacity: 0.3,
        }}
      ></div>

      <header className="relative z-20 bg-black bg-opacity-95 backdrop-blur-sm border-b border-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 bg-opacity-20 text-red-400 border border-red-600 border-opacity-30 rounded-xl hover:bg-opacity-30 transition-all backdrop-blur-sm font-medium"
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
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                    Smart Restaurant
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Delicious food, smart ordering
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {orderHistory.length > 0 && (
                <button
                  onClick={() => setShowOrderHistory(!showOrderHistory)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 bg-opacity-20 text-red-400 border border-red-600 border-opacity-30 rounded-xl hover:bg-opacity-30 transition-all backdrop-blur-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">{showOrderHistory ? 'Hide' : 'Show'} History</span>
                  <span className="sm:hidden">{showOrderHistory ? 'Hide' : 'Show'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {showOrderHistory && orderHistory.length > 0 && (
            <div className="mb-8 bg-gradient-to-br from-red-900 via-black to-red-800 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-red-600">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Order History</h2>
              
              <div className="space-y-4">
                {orderHistory.map(order => (
                  <div key={order.id} className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-base sm:text-lg">Order #{order.id}</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">{order.date}</p>
                        {order.tableNumber && (
                          <p className="text-red-400 text-xs sm:text-sm font-semibold">Table {order.tableNumber}</p>
                        )}
                        <span className="inline-block bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium mt-1">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-red-400 text-lg sm:text-xl">LKR {order.total.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-3">
                      <p className="text-gray-300 text-xs sm:text-sm mb-2">Items ordered:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {order.items.map(item => (
                          <div key={`${order.id}-${item.id}`} className="bg-gray-700 rounded-lg p-2">
                            <span className="text-white text-xs sm:text-sm">
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
              <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty cart" className="w-20 h-20 sm:w-24 sm:h-24 mb-4 opacity-80" />
              <div className="text-lg sm:text-xl font-semibold text-white mb-2">Your cart is empty</div>
              <div className="text-sm sm:text-base text-gray-300 mb-4 text-center px-4">Add some delicious items to get started!</div>
              <button 
                onClick={onBack}
                className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl font-bold text-sm sm:text-base hover:from-red-700 hover:to-red-900 transition-all shadow-lg hover:shadow-xl"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-800 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-red-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Shopping Cart ({getCartItemCount()} items)</h2>
                </div>
                
                <div className="space-y-4">
                  {cart.map(item => (
                    <div
                      key={item.uniqueItemId || item.id}
                      className={`rounded-2xl p-4 shadow-sm transition-all duration-300 border border-gray-700 ${activeId === item.id ? 'ring-2 ring-red-500 bg-gradient-to-r from-red-900 to-red-800' : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:shadow-md hover:border-red-500'}`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xl sm:text-2xl lg:text-3xl">🍽</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg mb-1 truncate">
                            {item.name}
                          </h3>
                          
                          {item.selectedSize && (
                            <div className="mb-2">
                              <span className="inline-block bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                Size: {item.selectedSize.name}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={() => handleQtyChange(item.id, -1)}
                                  disabled={item.qty <= 1 || loading}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-red-600 bg-gray-800 text-red-400 font-bold shadow hover:bg-red-900 transition-all text-sm ${
                                    item.qty <= 1 || loading ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'
                                  }`}
                                >
                                  -
                                </button>
                                <span className="font-semibold text-white text-sm sm:text-base lg:text-lg px-2 sm:px-3 min-w-[2rem] text-center">
                                  {item.qty}
                                </span>
                                <button
                                  onClick={() => handleQtyChange(item.id, 1)}
                                  disabled={loading}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-red-600 bg-gray-800 text-red-400 font-bold shadow hover:bg-red-900 transition-all hover:scale-110 disabled:opacity-50 text-sm"
                                >
                                  +
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={loading}
                                className="text-gray-400 hover:text-red-400 p-1 sm:p-2 rounded-full transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="text-left sm:text-right">
                              <div className="font-bold text-red-400 text-base sm:text-lg">
                                LKR {(item.price * item.qty).toFixed(2)}
                              </div>
                              <div className="text-xs sm:text-sm text-red-300">
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

              <div className="w-full lg:w-80 bg-gradient-to-br from-gray-900 via-black to-gray-800 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 h-fit border border-red-600">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Order Summary</h2>
                
                {tableNumber && (
                  <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded-xl">
                    <div className="flex items-center justify-center">
                      <span className="text-red-400 font-semibold text-base sm:text-lg">Table {tableNumber}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 mb-6 bg-gray-800 bg-opacity-70 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between text-gray-300 text-sm sm:text-base">
                    <span>Subtotal ({getCartItemCount()} items)</span>
                    <span className="text-red-400 font-semibold">LKR {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-base sm:text-lg">Total</span>
                      <span className="font-bold text-red-400 text-xl sm:text-2xl">LKR {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmOrder}
                  disabled={loading || orderLoading || cart.length === 0}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {orderLoading ? 'Placing Order...' : 'Confirm Order'}
                </button>
                
                <p className="text-xs text-gray-400 text-center mt-3">
                  Secure checkout • {tableNumber && `Table ${tableNumber} • `}Total: <span className="text-red-400 font-semibold">LKR {totalAmount.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          {showTableNumberModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-3xl p-6 max-w-md w-full border border-red-600 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Table Number Required</h3>
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
                  <p className="text-gray-300 mb-4 text-sm sm:text-base">
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
                    className="flex-1 py-3 bg-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetTableNumber}
                    disabled={isSubmittingTable || !tableNumberInput.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isSubmittingTable ? 'Setting...' : 'Continue Order'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CartPage;

import React, { useState, useEffect } from 'react';
import { 
  getAllOrders, 
  updateOrderStatus, 
  updatePaymentStatus,
  getOrdersByTable 
} from '../services/cartService';
import { ORDER_STATUS, PAYMENT_STATUS } from '../services/orderService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTable, setFilterTable] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load orders from Firestore
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedOrders;
      if (filterTable) {
        fetchedOrders = await getOrdersByTable(parseInt(filterTable));
      } else {
        const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
        fetchedOrders = await getAllOrders(filters);
      }
      
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Reload orders
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    }
  };

  // Handle payment status change
  const handlePaymentChange = async (orderId, newPaymentStatus) => {
    try {
      await updatePaymentStatus(orderId, newPaymentStatus);
      await loadOrders(); // Reload orders
      alert(`Payment status updated to ${newPaymentStatus}`);
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment status');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      served: 'bg-teal-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Get payment status color
  const getPaymentColor = (paymentStatus) => {
    const colors = {
      unpaid: 'bg-red-500',
      paid: 'bg-green-500',
      refunded: 'bg-orange-500'
    };
    return colors[paymentStatus] || 'bg-gray-500';
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    unpaid: orders.filter(o => o.paymentStatus === 'unpaid').length
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">Total Orders</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-yellow-700 text-sm">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-orange-700 text-sm">Preparing</div>
            <div className="text-2xl font-bold text-orange-800">{stats.preparing}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-green-700 text-sm">Ready</div>
            <div className="text-2xl font-bold text-green-800">{stats.ready}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-blue-700 text-sm">Revenue</div>
            <div className="text-2xl font-bold text-blue-800">LKR {stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setFilterTable('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Table</label>
              <input
                type="number"
                value={filterTable}
                onChange={(e) => {
                  setFilterTable(e.target.value);
                  setFilterStatus('all');
                }}
                placeholder="Table number"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterTable('');
                  loadOrders();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-xl text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          Table {order.tableNumber}
                        </span>
                        <span className={`px-3 py-1 ${getStatusColor(order.status)} text-white rounded-full text-sm font-semibold`}>
                          {order.status.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 ${getPaymentColor(order.paymentStatus)} text-white rounded-full text-sm font-semibold`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">LKR {order.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{order.itemCount} items</div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Order Items:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded p-2">
                          <div className="font-medium text-gray-800">{item.displayName || item.name}</div>
                          <div className="text-sm text-gray-600">
                            Qty: {item.qty} × LKR {item.price.toFixed(2)} = LKR {(item.qty * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Update Status:</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="served">Served</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Payment Status:</label>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handlePaymentChange(order.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800"><strong>Notes:</strong> {order.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Table Number</p>
                  <p className="text-lg font-semibold">{selectedOrder.tableNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Time</p>
                  <p className="text-lg font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 bg-gray-50 rounded mb-2">
                    <span>{item.displayName || item.name} × {item.qty}</span>
                    <span className="font-semibold">LKR {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>LKR {selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

// Collection name for orders
const ORDERS_COLLECTION = "orders";

/**
 * Create a new order in Firestore
 * @param {Object} orderData - Order details including items, total, table number
 * @returns {Promise<Object>} Created order with ID
 */
export const createOrder = async (orderData) => {
  try {
    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!orderData.tableNumber) {
      throw new Error('Table number is required');
    }

    // Calculate total from items
    const total = orderData.items.reduce((sum, item) => {
      return sum + (item.price * item.qty);
    }, 0);

    // Prepare order document
    const orderDocument = {
      // Order identification
      orderNumber: generateOrderNumber(),
      
      // Customer information
      guestId: orderData.guestId || sessionStorage.getItem('guestUserId'),
      customerName: orderData.customerName || "Guest",
      customerEmail: orderData.customerEmail || "",
      customerPhone: orderData.customerPhone || "",
      
      // Table information
      tableNumber: parseInt(orderData.tableNumber),
      
      // Order items with full details
      items: orderData.items.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        displayName: item.displayName || item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty,
        
        // Size information if applicable
        selectedSize: item.selectedSize ? {
          name: item.selectedSize.name,
          code: item.selectedSize.code,
          price: item.selectedSize.price
        } : null,
        hasSizes: item.hasSizes || false,
        
        // Additional item details
        category: item.category || "",
        image: item.image || ""
      })),
      
      // Order totals
      subtotal: total,
      tax: 0, // Add tax calculation if needed
      discount: 0, // Add discount if applicable
      total: total,
      
      // Order status and metadata
      status: "pending", // pending, confirmed, preparing, ready, served, completed, cancelled
      orderType: orderData.orderType || "dine-in",
      paymentMethod: orderData.paymentMethod || "cash",
      paymentStatus: "unpaid", // unpaid, paid, refunded
      
      // Notes and special instructions
      notes: orderData.notes || "",
      specialInstructions: orderData.specialInstructions || "",
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      orderTime: new Date().toISOString(),
      
      // Additional metadata
      itemCount: orderData.items.reduce((count, item) => count + item.qty, 0)
    };

    // Add order to Firestore
    const orderRef = await addDoc(collection(db, ORDERS_COLLECTION), orderDocument);
    
    // Return order with ID
    return {
      id: orderRef.id,
      ...orderDocument,
      createdAt: new Date().toISOString() // Convert for consistency
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

/**
 * Get all orders (for admin dashboard)
 * @param {Object} filters - Optional filters (status, tableNumber, date range)
 * @returns {Promise<Array>} Array of orders
 */
export const getAllOrders = async (filters = {}) => {
  try {
    let ordersQuery = collection(db, ORDERS_COLLECTION);
    const constraints = [];

    // Apply filters
    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }

    if (filters.tableNumber) {
      constraints.push(where("tableNumber", "==", parseInt(filters.tableNumber)));
    }

    if (filters.paymentStatus) {
      constraints.push(where("paymentStatus", "==", filters.paymentStatus));
    }

    // Order by creation time (newest first)
    constraints.push(orderBy("createdAt", "desc"));

    if (constraints.length > 0) {
      ordersQuery = query(ordersQuery, ...constraints);
    }

    const querySnapshot = await getDocs(ordersQuery);
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
};

/**
 * Get orders for a specific guest user
 * @param {string} guestId - Guest user ID
 * @returns {Promise<Array>} Array of user's orders
 */
export const getUserOrders = async (guestId) => {
  try {
    if (!guestId) {
      guestId = sessionStorage.getItem('guestUserId');
    }

    if (!guestId) {
      return [];
    }

    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where("guestId", "==", guestId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(ordersQuery);
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Get a single order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
export const getOrderById = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data(),
      createdAt: orderDoc.data().createdAt?.toDate().toISOString(),
      updatedAt: orderDoc.data().updatedAt?.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status (pending, confirmed, preparing, ready, served, completed, cancelled)
 * @returns {Promise<Object>} Updated order
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    return await getOrderById(orderId);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

/**
 * Update payment status
 * @param {string} orderId - Order ID
 * @param {string} paymentStatus - Payment status (unpaid, paid, refunded)
 * @returns {Promise<Object>} Updated order
 */
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    const validPaymentStatuses = ["unpaid", "paid", "refunded"];
    
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
    }

    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    await updateDoc(orderRef, {
      paymentStatus: paymentStatus,
      updatedAt: serverTimestamp()
    });

    return await getOrderById(orderId);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
};

/**
 * Get orders by table number
 * @param {number} tableNumber - Table number
 * @returns {Promise<Array>} Array of orders for that table
 */
export const getOrdersByTable = async (tableNumber) => {
  try {
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where("tableNumber", "==", parseInt(tableNumber)),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(ordersQuery);
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    return orders;
  } catch (error) {
    console.error('Error fetching table orders:', error);
    throw new Error(`Failed to fetch table orders: ${error.message}`);
  }
};

/**
 * Get today's orders
 * @returns {Promise<Array>} Array of today's orders
 */
export const getTodayOrders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where("createdAt", ">=", Timestamp.fromDate(today)),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(ordersQuery);
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    }));

    return orders;
  } catch (error) {
    console.error('Error fetching today orders:', error);
    throw new Error(`Failed to fetch today's orders: ${error.message}`);
  }
};

/**
 * Generate a unique order number
 * @returns {string} Order number in format: ORD-YYYYMMDD-XXXX
 */
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomNum}`;
};

/**
 * Calculate order statistics
 * @param {Array} orders - Array of orders
 * @returns {Object} Statistics object
 */
export const calculateOrderStats = (orders) => {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    totalItems: orders.reduce((sum, order) => sum + order.itemCount, 0),
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length 
      : 0,
    statusBreakdown: orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}),
    paymentBreakdown: orders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {})
  };
};

// Export order status constants
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded"
};
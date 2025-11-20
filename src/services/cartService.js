// Import order service for Firestore integration
import * as orderService from './orderService';
import config from '../config';

// API base URL
const API_BASE_URL = config.API_BASE_URL;

// Helper function to get or create a guest user ID (session-based)
const getGuestUserId = () => {
  let guestId = sessionStorage.getItem('guestUserId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('guestUserId', guestId);
  }
  return guestId;
};

// Get or set table number for the session
export const getTableNumber = () => {
  return sessionStorage.getItem('tableNumber');
};

export const setTableNumber = (tableNumber) => {
  sessionStorage.setItem('tableNumber', tableNumber.toString());
};

// Get all items in user's cart
export const getCartItems = async () => {
  try {
    const userId = getGuestUserId();

    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // Return empty cart if not found
      }
      throw new Error("Failed to fetch cart items");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    // Return empty array instead of throwing error for better UX
    return [];
  }
};

// Add item to cart with enhanced support for sizes and table numbers
export const addToCart = async (cartItem, quantity = 1) => {
  try {
    const userId = getGuestUserId();
    const tableNumber = getTableNumber();

    // Create unique identifier for items with different sizes
    const uniqueItemId = cartItem.selectedSize 
      ? `${cartItem.id || cartItem.menuItemId}_${cartItem.selectedSize.code}`
      : (cartItem.id || cartItem.menuItemId);

    console.log('=== ADD TO CART DEBUG ===');
    console.log('Menu Item ID:', cartItem.id || cartItem.menuItemId);
    console.log('Selected Size:', cartItem.selectedSize);
    console.log('Unique Item ID:', uniqueItemId);
    console.log('========================');

    // Prepare cart item data with new size structure
    const cartItemData = {
      menuItemId: cartItem.id || cartItem.menuItemId,
      name: cartItem.name,
      price: cartItem.selectedSize ? cartItem.selectedSize.price : cartItem.price,
      image: cartItem.image || '',
      qty: quantity,
      
      // Size-related fields (new structure)
      hasSizes: cartItem.hasSizes || false,
      basePrice: cartItem.basePrice || cartItem.price,
      selectedSize: cartItem.selectedSize ? {
        name: cartItem.selectedSize.name,
        price: cartItem.selectedSize.price,
        code: cartItem.selectedSize.code // Include size code
      } : null,
      displayName: cartItem.selectedSize 
        ? `${cartItem.name} (${cartItem.selectedSize.name})`
        : cartItem.name,
      
      // Unique identifier to distinguish different sizes of same item
      uniqueItemId: uniqueItemId,
      
      // Table number from session
      tableNumber: tableNumber ? parseInt(tableNumber) : null,
      
      // Additional metadata
      category: cartItem.category || '',
      description: cartItem.description || '',
      tags: cartItem.tags || []
    };

    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartItemData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add item to cart");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (cartItemId, newQuantity) => {
  try {
    const userId = getGuestUserId();

    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/items/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qty: newQuantity
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update cart item");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (cartItemId) => {
  try {
    const userId = getGuestUserId();

    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/items/${cartItemId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to remove item from cart");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Clear entire cart
export const clearCart = async () => {
  try {
    const userId = getGuestUserId();

    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to clear cart");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Create order from cart - NOW STORES IN FIRESTORE!
export const createOrder = async (orderDetails) => {
  try {
    const userId = getGuestUserId();
    const tableNumber = getTableNumber();

    if (!tableNumber) {
      throw new Error('Table number is required for checkout.');
    }

    // Get current cart items for the order
    const cartItems = await getCartItems();
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty. Cannot create order.');
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Prepare order data for Firestore
    const orderData = {
      // Guest user ID
      guestId: userId,
      
      // Customer details
      customerName: orderDetails.customerName || "Guest User",
      customerEmail: orderDetails.customerEmail || "",
      customerPhone: orderDetails.customerPhone || "",
      
      // Table number from session
      tableNumber: parseInt(tableNumber),
      
      // Order items from cart
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId || item.id,
        name: item.name,
        displayName: item.displayName || item.name,
        price: item.price,
        qty: item.qty,
        selectedSize: item.selectedSize,
        hasSizes: item.hasSizes,
        category: item.category,
        image: item.image
      })),
      
      // Payment and order details
      paymentMethod: orderDetails.paymentMethod || "cash",
      orderType: orderDetails.orderType || "dine-in",
      notes: orderDetails.notes || "",
      specialInstructions: orderDetails.specialInstructions || ""
    };

    console.log('Creating order in Firestore:', orderData);

    // Store order in Firestore using orderService
    const firestoreOrder = await orderService.createOrder(orderData);
    
    console.log('Order created successfully in Firestore:', firestoreOrder);

    // Clear cart after successful order creation
    await clearCart();
    
    // Clear table number from session
    sessionStorage.removeItem('tableNumber');
    
    return firestoreOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get order history for a user from Firestore
export const getOrderHistory = async () => {
  try {
    const userId = getGuestUserId();
    
    // Fetch orders from Firestore
    const orders = await orderService.getUserOrders(userId);
    
    return orders;
  } catch (error) {
    console.error('Error fetching order history:', error);
    return []; // Return empty array on error for better UX
  }
};

// Get all orders (admin function)
export const getAllOrders = async (filters = {}) => {
  try {
    const orders = await orderService.getAllOrders(filters);
    return orders;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

// Get orders by table number
export const getOrdersByTable = async (tableNumber) => {
  try {
    const orders = await orderService.getOrdersByTable(tableNumber);
    return orders;
  } catch (error) {
    console.error('Error fetching table orders:', error);
    throw error;
  }
};

// Update order status (for admin use)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const updatedOrder = await orderService.updateOrderStatus(orderId, status);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    const updatedOrder = await orderService.updatePaymentStatus(orderId, paymentStatus);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Helper function to validate cart item before adding
export const validateCartItem = (item) => {
  const errors = [];
  
  if (!item.name) {
    errors.push('Item name is required');
  }
  
  const price = item.selectedSize ? item.selectedSize.price : item.price;
  if (!price || price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (item.hasSizes && !item.selectedSize) {
    errors.push('Size selection is required for this item');
  }
  
  const tableNumber = getTableNumber();
  if (!tableNumber) {
    errors.push('Table number must be set before adding items to cart');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to calculate item total price
export const calculateItemTotal = (item) => {
  const price = item.selectedSize ? item.selectedSize.price : item.price;
  return price * item.qty;
};

// Helper function to format cart item for display
export const formatCartItemForDisplay = (item) => {
  const price = item.selectedSize ? item.selectedSize.price : item.price;
  const total = calculateItemTotal(item);
  
  return {
    ...item,
    displayName: item.selectedSize 
      ? `${item.name} (${item.selectedSize.name})`
      : item.name,
    formattedPrice: `LKR ${price.toFixed(2)}`,
    formattedTotal: `LKR ${total.toFixed(2)}`,
    sizeInfo: item.selectedSize ? {
      name: item.selectedSize.name,
      price: item.selectedSize.price
    } : null
  };
};

// Helper function to calculate cart totals
export const calculateCartTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  return {
    subtotal,
    formattedSubtotal: `LKR ${subtotal.toFixed(2)}`,
    itemCount: cartItems.reduce((count, item) => count + item.qty, 0)
  };
};

// Predefined size options
export const PREDEFINED_SIZES = {
  SMALL: { name: 'Small', code: 'S' },
  MEDIUM: { name: 'Medium', code: 'M' },
  LARGE: { name: 'Large', code: 'L' }
};
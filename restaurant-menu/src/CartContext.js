import React, { createContext, useState, useEffect, useContext } from 'react';
import * as cartService from './services/cartService';
import config from './config';
const CartContext = createContext();

// Export the context so it can be imported elsewhere
export { CartContext };

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart when component mounts (no auth needed)
  useEffect(() => {
    loadCart();
  }, []);

  // Load cart from backend
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartItems = await cartService.getCartItems();
      
      // Add uniqueItemId to each cart item for proper rendering
      const cartItemsWithUniqueId = cartItems.map(item => ({
        ...item,
        uniqueItemId: item.selectedSize 
          ? `${item.menuItemId || item.id}_${item.selectedSize.code}` 
          : (item.menuItemId || item.id)
      }));
      
      setCart(cartItemsWithUniqueId);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
      setCart([]); // Fallback to empty cart
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart with size and table number support
  const addToCart = async (menuItem, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create unique identifier for items with sizes
      const uniqueItemId = menuItem.selectedSize 
        ? `${menuItem.id}_${menuItem.selectedSize.code}` 
        : menuItem.id;
      
      // Check if item with this exact size already exists in cart BEFORE calling backend
      const existingItemIndex = cart.findIndex(item => {
        const cartItemUniqueId = item.selectedSize 
          ? `${item.menuItemId || item.id}_${item.selectedSize.code}` 
          : (item.menuItemId || item.id);
        return cartItemUniqueId === uniqueItemId;
      });

      if (existingItemIndex >= 0) {
        // Item with this size already exists - update quantity
        const existingItem = cart[existingItemIndex];
        const newQuantity = existingItem.qty + quantity;
        
        // Call backend to update quantity
        const updatedItem = await cartService.updateCartItemQuantity(
          existingItem.id, 
          newQuantity
        );
        
        // Update local state
        const updatedCart = [...cart];
        updatedCart[existingItemIndex] = {
          ...updatedItem,
          uniqueItemId: uniqueItemId
        };
        setCart(updatedCart);
        return updatedItem;
      }
      
      // Item doesn't exist - add new item
      const cartItem = {
        ...menuItem,
        qty: quantity,
        cartId: Date.now() + Math.random(),
        uniqueItemId: uniqueItemId,
        
        // Handle display name for sized items
        displayName: menuItem.selectedSize 
          ? `${menuItem.name} (${menuItem.selectedSize.name})`
          : menuItem.name,
          
        // Ensure price is set correctly (use selected size price if available)
        price: menuItem.selectedSize ? menuItem.selectedSize.price : menuItem.price,
        
        // Include size information
        hasSizes: menuItem.hasSizes || false,
        basePrice: menuItem.basePrice || menuItem.price,
        selectedSize: menuItem.selectedSize || null,
        
        // Include table number
        tableNumber: menuItem.tableNumber || null
      };
      
      const newItem = await cartService.addToCart(cartItem, quantity);
      
      // Add to cart with unique ID
      setCart([...cart, { ...newItem, uniqueItemId: uniqueItemId }]);
      return newItem;
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId, delta) => {
    try {
      setLoading(true);
      setError(null);
      
      const item = cart.find(item => item.id === cartItemId);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      const newQuantity = item.qty + delta;
      
      if (newQuantity <= 0) {
        // Remove item if quantity becomes 0 or less
        await removeFromCart(cartItemId);
        return;
      }

      const updatedItem = await cartService.updateCartItemQuantity(cartItemId, newQuantity);
      
      // Update local state while preserving uniqueItemId
      setCart(cart.map(cartItem => 
        cartItem.id === cartItemId 
          ? { ...updatedItem, uniqueItemId: cartItem.uniqueItemId } 
          : cartItem
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update item quantity');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    try {
      setLoading(true);
      setError(null);
      
      await cartService.removeFromCart(cartItemId);
      
      // Update local state
      setCart(cart.filter(item => item.id !== cartItemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item from cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await cartService.clearCart();
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create order with table number support
  const createOrder = async (orderDetails) => {
    try {
      setLoading(true);
      setError(null);
      
      // Include table number from cart items
      const tableNumber = cart.length > 0 ? cart[0].tableNumber : null;
      
      const orderData = {
        ...orderDetails,
        tableNumber,
        items: cart.map(item => ({
          ...item,
          // Ensure we have the display name for the order
          displayName: item.displayName || item.name
        }))
      };
      
      const order = await cartService.createOrder(orderData);
      
      // Clear cart after successful order
      setCart([]);
      
      // Clear table number from session storage
      sessionStorage.removeItem('tableNumber');
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate cart totals
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.qty, 0);
  };

  // Get unique table numbers from cart (should only be one)
  const getTableNumber = () => {
    if (cart.length === 0) return null;
    return cart[0].tableNumber;
  };

  // Check if cart has items with different table numbers (shouldn't happen)
  const validateTableNumbers = () => {
    const tableNumbers = [...new Set(cart.map(item => item.tableNumber).filter(Boolean))];
    return tableNumbers.length <= 1;
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    getCartTotal,
    getCartItemCount,
    getTableNumber,
    validateTableNumbers,
    loadCart // In case you need to manually reload cart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
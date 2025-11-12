const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const fetch = require('node-fetch');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io setup - MUST be before using io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 4000;

// Make io accessible to routes
app.set('io', io);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-service-account.json')),
    projectId: 'resturant-menu-eb399',
  });
}

// Socket.io connection handling - NOW io exists
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_admin', (adminId) => {
    socket.join('admin_room');
    console.log(`Admin ${adminId} joined notification room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.userId || !orderData.customerName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get cart items
    const cartSnapshot = await admin.firestore()
      .collection('carts')
      .doc(orderData.userId)
      .collection('items')
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const cartItems = cartSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Calculate total
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Create order document
    const newOrderData = {
      userId: orderData.userId,
      customerName: orderData.customerName || "Guest User",
      customerEmail: orderData.customerEmail || "",
      customerPhone: orderData.customerPhone || "",
      deliveryAddress: orderData.deliveryAddress || "",
      paymentMethod: orderData.paymentMethod || "cash",
      tableNumber: orderData.tableNumber ? parseInt(orderData.tableNumber) : null,
      items: cartItems,
      subtotal: subtotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save order to Firestore
    const orderRef = await admin.firestore()
      .collection('orders')
      .add(newOrderData);

    // Clear cart
    const batch = admin.firestore().batch();
    cartSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // PREPARE NOTIFICATION DATA
    const notificationData = {
      orderId: orderRef.id,
      tableNumber: newOrderData.tableNumber,
      customerName: newOrderData.customerName,
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      total: subtotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // SAVE NOTIFICATION TO DATABASE
    const notificationRef = await admin.firestore()
      .collection('notifications')
      .add({
        ...notificationData,
        type: 'new_order',
        isRead: false,
        createdAt: new Date().toISOString()
      });

    console.log('Notification saved to database:', notificationRef.id);

    // EMIT REAL-TIME NOTIFICATION TO ADMIN (with database ID)
    const realtimeNotification = {
      ...notificationData,
      notificationId: notificationRef.id,
      createdAt: new Date().toLocaleString()
    };

    io.to('admin_room').emit('new_order', realtimeNotification);
    console.log('Order notification sent to admin:', realtimeNotification);

    res.status(201).json({ 
      id: orderRef.id, 
      ...newOrderData,
      message: 'Order placed successfully' 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

app.put('/api/orders/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    const orderRef = admin.firestore().collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await orderRef.update({
      status: 'completed',
      paymentStatus: paymentStatus || 'completed',
      paymentMethod: paymentMethod || 'cash',
      completedAt: new Date().toISOString()
    });

    // Notify customer that order is completed
    io.to(`order-${orderId}`).emit('order_completed', { orderId });

    res.json({ success: true, message: 'Order completed' });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending orders for admin (only status: pending)
app.get('/api/orders/pending/all', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('orders')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order history (completed orders)
app.get('/api/orders/history/all', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('orders')
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.warn('FIREBASE_API_KEY not set - login functionality disabled');
    return res.status(500).json({ message: 'Server configuration error: Missing API key' });
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(401).json({ message: data.error?.message || 'Authentication failed' });
    }

    const idToken = data.idToken;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    res.json({ idToken });
  } catch (error) {
    console.error('Error processing login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// MENU ITEMS ENDPOINTS
app.get('/api/menu-items', async (req, res) => {
  try {
    console.log('Fetching menu items from Firestore...');
    const snapshot = await admin.firestore().collection('restaurantMenu').get();
    const menuItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${menuItems.length} menu items`);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    if (error.code === 'app/no-app') {
      return res.status(500).json({ 
        message: 'Firebase not properly initialized', 
        error: 'Please check Firebase configuration' 
      });
    }
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
});

app.post('/api/menu-items', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const item = req.body;
    
    if (!item.name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (item.hasSizes) {
      if (!item.sizeOptions || !Array.isArray(item.sizeOptions) || item.sizeOptions.length === 0) {
        return res.status(400).json({ message: 'Size options are required for items with sizes' });
      }
      
      for (let i = 0; i < item.sizeOptions.length; i++) {
        const size = item.sizeOptions[i];
        if (!size.name || !size.name.trim()) {
          return res.status(400).json({ message: `Size option ${i + 1}: Name is required` });
        }
        if (!size.price || parseFloat(size.price) <= 0) {
          return res.status(400).json({ message: `Size option ${i + 1}: Valid price is required` });
        }
      }
    } else {
      if (!item.price || parseFloat(item.price) <= 0) {
        return res.status(400).json({ message: 'Price is required for items without sizes' });
      }
    }

    const itemData = {
      name: item.name.trim(),
      description: item.description?.trim() || '',
      category: item.category?.trim() || '',
      image: item.image?.trim() || '',
      tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',').map(t => t.trim()).filter(t => t) : []),
      availableAmount: item.availableAmount ? parseInt(item.availableAmount) : 0,
      available: item.available !== undefined ? item.available : true,
      hasSizes: Boolean(item.hasSizes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (item.hasSizes) {
      itemData.sizeOptions = item.sizeOptions.map(size => ({
        name: size.name.trim(),
        price: parseFloat(size.price),
        available: size.available !== undefined ? size.available : true,
        code: size.code || size.name.trim().toLowerCase().replace(/\s+/g, '_')
      }));
      itemData.price = null;
    } else {
      itemData.price = parseFloat(item.price);
      itemData.sizeOptions = null;
    }

    const docRef = await admin.firestore().collection('restaurantMenu').add(itemData);
    res.status(201).json({ id: docRef.id, ...itemData });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Failed to add menu item', error: error.message });
  }
});

app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const updatedData = req.body;
    
    if (!updatedData.name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (updatedData.hasSizes) {
      if (!updatedData.sizeOptions || !Array.isArray(updatedData.sizeOptions) || updatedData.sizeOptions.length === 0) {
        return res.status(400).json({ message: 'Size options are required for items with sizes' });
      }
      
      for (let i = 0; i < updatedData.sizeOptions.length; i++) {
        const size = updatedData.sizeOptions[i];
        if (!size.name || !size.name.trim()) {
          return res.status(400).json({ message: `Size option ${i + 1}: Name is required` });
        }
        if (!size.price || parseFloat(size.price) <= 0) {
          return res.status(400).json({ message: `Size option ${i + 1}: Valid price is required` });
        }
      }
    } else {
      if (!updatedData.price || parseFloat(updatedData.price) <= 0) {
        return res.status(400).json({ message: 'Price is required for items without sizes' });
      }
    }

    const itemData = {
      name: updatedData.name.trim(),
      description: updatedData.description?.trim() || '',
      category: updatedData.category?.trim() || '',
      image: updatedData.image?.trim() || '',
      tags: Array.isArray(updatedData.tags) ? updatedData.tags : (updatedData.tags ? updatedData.tags.split(',').map(t => t.trim()).filter(t => t) : []),
      availableAmount: updatedData.availableAmount ? parseInt(updatedData.availableAmount) : 0,
      available: updatedData.available !== undefined ? updatedData.available : true,
      hasSizes: Boolean(updatedData.hasSizes),
      updatedAt: new Date().toISOString()
    };

    if (updatedData.hasSizes) {
      itemData.sizeOptions = updatedData.sizeOptions.map(size => ({
        name: size.name.trim(),
        price: parseFloat(size.price),
        available: size.available !== undefined ? size.available : true,
        code: size.code || size.name.trim().toLowerCase().replace(/\s+/g, '_')
      }));
      itemData.price = null;
    } else {
      itemData.price = parseFloat(updatedData.price);
      itemData.sizeOptions = null;
    }

    const docRef = admin.firestore().collection('restaurantMenu').doc(id);
    await docRef.update(itemData);
    res.json({ id, ...itemData });
  } catch (error) {
    console.error('Error updating menu item:', error);
    if (error.code === 'not-found') {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
});

app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const docRef = admin.firestore().collection('restaurantMenu').doc(id);
    
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await docRef.delete();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
});

// CART ENDPOINTS
app.get('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    console.log(`Fetching cart items for user: ${userId}`);

    const snapshot = await admin.firestore()
      .collection('carts')
      .doc(userId)
      .collection('items')
      .get();

    if (snapshot.empty) {
      console.log(`No cart items found for user: ${userId}`);
      return res.json([]);
    }

    const cartItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${cartItems.length} cart items for user: ${userId}`);
    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    if (error.code === 'app/no-app') {
      return res.status(500).json({ 
        message: 'Firebase not properly initialized', 
        error: 'Please check Firebase configuration' 
      });
    }
    res.status(500).json({ message: 'Failed to fetch cart items', error: error.message });
  }
});

app.post('/api/cart/:userId/items', async (req, res) => {
  try {
    const { userId } = req.params;
    const cartItemData = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!cartItemData.menuItemId || !cartItemData.name || !cartItemData.price || !cartItemData.qty) {
      return res.status(400).json({ message: 'Missing required fields: menuItemId, name, price, qty' });
    }

    const itemData = {
      menuItemId: cartItemData.menuItemId,
      name: cartItemData.name,
      price: parseFloat(cartItemData.price),
      qty: parseInt(cartItemData.qty),
      image: cartItemData.image || '',
      category: cartItemData.category || '',
      description: cartItemData.description || '',
      tags: cartItemData.tags || [],
      tableNumber: cartItemData.tableNumber ? parseInt(cartItemData.tableNumber) : null,
      hasSizes: Boolean(cartItemData.hasSizes),
      basePrice: cartItemData.basePrice ? parseFloat(cartItemData.basePrice) : null,
      selectedSize: cartItemData.selectedSize || null,
      displayName: cartItemData.displayName || cartItemData.name,
      uniqueItemId: cartItemData.uniqueItemId || cartItemData.menuItemId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingItemQuery = await admin.firestore()
      .collection('carts')
      .doc(userId)
      .collection('items')
      .where('uniqueItemId', '==', itemData.uniqueItemId)
      .get();

    if (!existingItemQuery.empty) {
      const existingDoc = existingItemQuery.docs[0];
      const existingData = existingDoc.data();
      const newQty = existingData.qty + parseInt(cartItemData.qty);
      
      await existingDoc.ref.update({
        qty: newQty,
        updatedAt: new Date().toISOString()
      });

      const updatedData = { ...existingData, qty: newQty, updatedAt: new Date().toISOString() };
      res.json({ id: existingDoc.id, ...updatedData });
    } else {
      const docRef = await admin.firestore()
        .collection('carts')
        .doc(userId)
        .collection('items')
        .add(itemData);

      res.status(201).json({ id: docRef.id, ...itemData });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

app.put('/api/cart/:userId/items/:cartItemId', async (req, res) => {
  try {
    const { userId, cartItemId } = req.params;
    const { qty } = req.body;

    if (!userId || !cartItemId) {
      return res.status(400).json({ message: 'User ID and cart item ID are required' });
    }

    if (!qty || parseInt(qty) <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const docRef = admin.firestore()
      .collection('carts')
      .doc(userId)
      .collection('items')
      .doc(cartItemId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const updatedData = {
      qty: parseInt(qty),
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updatedData);

    const itemData = doc.data();
    res.json({ id: cartItemId, ...itemData, ...updatedData });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Failed to update cart item', error: error.message });
  }
});

app.delete('/api/cart/:userId/items/:cartItemId', async (req, res) => {
  try {
    const { userId, cartItemId } = req.params;

    if (!userId || !cartItemId) {
      return res.status(400).json({ message: 'User ID and cart item ID are required' });
    }

    const docRef = admin.firestore()
      .collection('carts')
      .doc(userId)
      .collection('items')
      .doc(cartItemId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await docRef.delete();
    res.json({ message: 'Cart item removed successfully', id: cartItemId });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Failed to remove cart item', error: error.message });
  }
});

app.delete('/api/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const snapshot = await admin.firestore()
      .collection('carts')
      .doc(userId)
      .collection('items')
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
});

app.get('/api/orders/pending', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('orders')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all unread notifications for admin
app.get('/api/notifications/admin', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('isRead', '==', false)
      .where('type', '==', 'new_order')
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notificationRef = admin.firestore()
      .collection('notifications')
      .doc(notificationId);

    const doc = await notificationRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notificationRef.update({
      isRead: true,
      readAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('isRead', '==', false)
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: new Date().toISOString()
      });
    });

    await batch.commit();
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete old read notifications (optional cleanup)
app.delete('/api/notifications/cleanup', async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('isRead', '==', true)
      .where('createdAt', '<', threeDaysAgo.toISOString())
      .get();

    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    res.json({ success: true, message: `Deleted ${snapshot.size} old notifications` });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status (confirm ready/payment)
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const orderRef = admin.firestore().collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = {
      status: status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'ready') {
      updateData.readyAt = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    await orderRef.update(updateData);

    const updatedOrder = {
      id: orderId,
      ...orderDoc.data(),
      ...updateData
    };

    // Emit notification to customer
    io.to(`user_${orderDoc.data().userId}`).emit('order_status_updated', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// Get order history for a user
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await admin.firestore()
      .collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// ALSO UPDATE the socket.io connection to support user rooms:
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_admin', (adminId) => {
    socket.join('admin_room');
    console.log(`Admin ${adminId} joined notification room`);
  });

  // ADD THIS for user notifications
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined notification room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// CREATE ORDER from cart - FIXED
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.userId || !orderData.customerName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get cart items
    const cartSnapshot = await admin.firestore()
      .collection('carts')
      .doc(orderData.userId)
      .collection('items')
      .get();

    if (cartSnapshot.empty) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const cartItems = cartSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Calculate total
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Create order document
    const newOrderData = {
      userId: orderData.userId,
      customerName: orderData.customerName || "Guest User",
      customerEmail: orderData.customerEmail || "",
      customerPhone: orderData.customerPhone || "",
      deliveryAddress: orderData.deliveryAddress || "",
      paymentMethod: orderData.paymentMethod || "cash",
      tableNumber: orderData.tableNumber ? parseInt(orderData.tableNumber) : null,
      items: cartItems,
      subtotal: subtotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save order to Firestore
    const orderRef = await admin.firestore()
      .collection('orders')
      .add(newOrderData);

    // Clear cart
    const batch = admin.firestore().batch();
    cartSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // EMIT NOTIFICATION TO ADMIN
    const notificationData = {
      orderId: orderRef.id,
      tableNumber: newOrderData.tableNumber,
      customerName: newOrderData.customerName,
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      total: subtotal,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
      timestamp: Date.now()
    };

    io.to('admin_room').emit('new_order', notificationData);
    console.log('Order notification sent to admin:', notificationData);

    res.status(201).json({ 
      id: orderRef.id, 
      ...newOrderData,
      message: 'Order placed successfully' 
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
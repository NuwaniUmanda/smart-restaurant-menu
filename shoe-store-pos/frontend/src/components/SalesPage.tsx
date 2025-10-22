import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  brand_name: string;
  category_name: string;
  price: number;
  image_url: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string;
}

interface CartItem {
  product_variant_id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost/shoe-store-pos/backend/api/products.php');
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleProductClick = async (product: Product) => {
    try {
      const response = await axios.get(`http://localhost/shoe-store-pos/backend/api/products.php?id=${product.id}`);
      setSelectedProduct(response.data);
      setShowVariantModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };

  const addToCart = (variant: ProductVariant, quantity: number = 1) => {
    if (!selectedProduct || variant.stock_quantity < quantity) {
      alert('Insufficient stock!');
      return;
    }

    const existingItem = cart.find(item => item.product_variant_id === variant.id);
    
    if (existingItem) {
      if (existingItem.quantity + quantity > variant.stock_quantity) {
        alert('Insufficient stock!');
        return;
      }
      
      setCart(cart.map(item =>
        item.product_variant_id === variant.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
              total_price: (item.quantity + quantity) * item.unit_price
            }
          : item
      ));
    } else {
      const newItem: CartItem = {
        product_variant_id: variant.id,
        product_name: selectedProduct.name,
        size: variant.size,
        color: variant.color,
        quantity,
        unit_price: selectedProduct.price,
        total_price: quantity * selectedProduct.price
      };
      setCart([...cart, newItem]);
    }

    setShowVariantModal(false);
  };

  const updateCartQuantity = (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart(cart.map(item =>
      item.product_variant_id === variantId
        ? {
            ...item,
            quantity: newQuantity,
            total_price: newQuantity * item.unit_price
          }
        : item
    ));
  };

  const removeFromCart = (variantId: number) => {
    setCart(cart.filter(item => item.product_variant_id !== variantId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - discount;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    try {
      const saleData = {
        user_id: 1, // Default user
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        discount_amount: discount,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        items: cart
      };

      const response = await axios.post('http://localhost/shoe-store-pos/backend/api/sales.php', saleData);
      
      if (response.data.sale_id) {
        alert(`Sale completed successfully! Sale #: ${response.data.sale_number}`);
        
        // Reset form
        setCart([]);
        setCustomerInfo({ name: '', phone: '', email: '' });
        setDiscount(0);
        
        // Refresh products to update stock
        fetchProducts();
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Sales</h1>
      </div>

      <div className="grid grid-2" style={{ gap: '20px' }}>
        {/* Products Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Products</h3>
          </div>

          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-name">{product.name}</div>
                <div className="product-brand">{product.brand_name}</div>
                <div className="product-price">${product.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Shopping Cart</h3>
          </div>

          {cart.length > 0 ? (
            <>
              {cart.map((item) => (
                <div key={item.product_variant_id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product_name}</div>
                    <div className="cart-item-details">
                      Size: {item.size} | Color: {item.color}
                    </div>
                  </div>
                  
                  <div className="cart-item-quantity">
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.product_variant_id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateCartQuantity(item.product_variant_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div>${item.total_price.toFixed(2)}</div>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                      onClick={() => removeFromCart(item.product_variant_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="cart-total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (8%):</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="total-row final">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Information */}
              <div style={{ marginTop: '20px' }}>
                <h4>Customer Information</h4>
                <div className="form-row">
                  <div className="form-col">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Customer Name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    />
                  </div>
                  <div className="form-col">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    />
                  </div>
                </div>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  style={{ marginTop: '10px' }}
                />
              </div>

              {/* Payment Options */}
              <div style={{ marginTop: '20px' }}>
                <h4>Payment Method</h4>
                <div className="form-row">
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="digital">Digital Payment</option>
                  </select>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Discount Amount"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button
                className="btn btn-success"
                style={{ width: '100%', marginTop: '20px', padding: '15px' }}
                onClick={processSale}
              >
                Complete Sale - ${calculateTotal().toFixed(2)}
              </button>
            </>
          ) : (
            <p style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
              Cart is empty. Select products to add to cart.
            </p>
          )}
        </div>
      </div>

      {/* Product Variant Modal */}
      {showVariantModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{selectedProduct.name}</h3>
              <button
                className="close-btn"
                onClick={() => setShowVariantModal(false)}
              >
                ×
              </button>
            </div>

            <div>
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
              />
              
              <p><strong>Brand:</strong> {selectedProduct.brand_name}</p>
              <p><strong>Category:</strong> {selectedProduct.category_name}</p>
              <p><strong>Price:</strong> ${selectedProduct.price}</p>
              <p><strong>Description:</strong> {selectedProduct.description}</p>

              <h4 style={{ marginTop: '20px', marginBottom: '15px' }}>Available Variants:</h4>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                {selectedProduct.variants.map((variant) => (
                  <div
                    key={variant.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  >
                    <div>
                      <strong>Size {variant.size}</strong> - {variant.color}
                      <br />
                      <small>Stock: {variant.stock_quantity}</small>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => addToCart(variant)}
                      disabled={variant.stock_quantity === 0}
                    >
                      {variant.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
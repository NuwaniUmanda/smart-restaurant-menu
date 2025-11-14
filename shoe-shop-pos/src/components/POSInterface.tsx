import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, User, CreditCard, DollarSign, Package } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { dataService } from '../services/dataService';
import { Shoe, Customer, PaymentMethod } from '../types';

const POSInterface: React.FC = () => {
  const { state, dispatch } = usePOS();
  const { cart, selectedCustomer } = state.ui;
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShoes, setFilteredShoes] = useState<Shoe[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadShoes();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredShoes(shoes);
    } else {
      const filtered = shoes.filter(shoe =>
        shoe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shoe.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shoe.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShoes(filtered);
    }
  }, [searchQuery, shoes]);

  const loadShoes = async () => {
    try {
      const shoesData = await dataService.getShoes();
      setShoes(shoesData);
      setFilteredShoes(shoesData);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load shoes' });
    }
  };

  const loadCustomers = async () => {
    try {
      const customersData = await dataService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const addToCart = (shoe: Shoe, size: string) => {
    const sizeData = shoe.sizes.find(s => s.size === size);
    if (!sizeData || sizeData.stock <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Size not available' });
      return;
    }

    dispatch({ type: 'ADD_TO_CART', payload: { shoe, size, quantity: 1 } });
  };

  const updateCartItemQuantity = (index: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: index });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: index, quantity: newQuantity } });
    }
  };

  const removeFromCart = (index: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: index });
  };

  const selectCustomer = (customer: Customer) => {
    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
    setShowCustomerModal(false);
  };

  const processPayment = async (paymentMethod: PaymentMethod) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await dataService.createSale(
        cart.items,
        selectedCustomer?.id,
        paymentMethod,
        state.currentEmployee?.id || '1',
        cart.discount
      );

      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: undefined });
      setShowPaymentModal(false);
      
      // Show success message
      alert('Sale completed successfully!');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process payment' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="flex-1 flex">
      {/* Product Selection */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredShoes.map((shoe) => (
            <div key={shoe.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{shoe.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{shoe.brand}</p>
              <p className="text-blue-600 font-bold text-lg mb-3">${shoe.basePrice.toFixed(2)}</p>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Available Sizes:</p>
                <div className="flex flex-wrap gap-1">
                  {shoe.sizes.map((size) => (
                    <button
                      key={size.size}
                      onClick={() => addToCart(shoe, size.size)}
                      disabled={size.stock <= 0}
                      className={`px-2 py-1 text-xs rounded ${
                        size.stock > 0
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {size.size} ({size.stock})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="w-96 bg-white border-l border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {cart.items.length} items
          </span>
        </div>

        {/* Customer Selection */}
        <div className="mb-4">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Select Customer (Optional)'}
              </span>
            </div>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-4">
          {cart.items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.shoe.name}</h4>
                      <p className="text-xs text-gray-600">{item.shoe.brand} - Size {item.size}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index.toString())}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartItemQuantity(index.toString(), item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(index.toString(), item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-medium text-sm">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${cart.tax.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => selectCustomer(undefined as any)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded border"
              >
                <div className="font-medium">Walk-in Customer</div>
                <div className="text-sm text-gray-600">No customer account</div>
              </button>
              
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded border"
                >
                  <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                  <div className="text-xs text-blue-600">{customer.loyaltyPoints} points</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={cart.total}
          onPayment={processPayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal: React.FC<{
  total: number;
  onPayment: (method: PaymentMethod) => void;
  onClose: () => void;
}> = ({ total, onPayment, onClose }) => {
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'digital'>('cash');
  const [cashAmount, setCashAmount] = useState(total.toString());

  const handlePayment = () => {
    const paymentMethod: PaymentMethod = {
      type: paymentType,
      amount: total,
    };

    if (paymentType === 'cash') {
      const cash = parseFloat(cashAmount);
      if (cash < total) {
        alert('Insufficient cash amount');
        return;
      }
    }

    onPayment(paymentMethod);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Payment</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-2xl font-bold text-center mb-4">
            Total: ${total.toFixed(2)}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setPaymentType('cash')}
              className={`w-full flex items-center p-3 rounded-lg border ${
                paymentType === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5 mr-3" />
              <span>Cash</span>
            </button>

            <button
              onClick={() => setPaymentType('card')}
              className={`w-full flex items-center p-3 rounded-lg border ${
                paymentType === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5 mr-3" />
              <span>Credit/Debit Card</span>
            </button>
          </div>

          {paymentType === 'cash' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Cash Amount</label>
              <input
                type="number"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              {parseFloat(cashAmount) > total && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ${(parseFloat(cashAmount) - total).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handlePayment}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Complete Payment
        </button>
      </div>
    </div>
  );
};

export default POSInterface;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_name: string;
}

interface SaleDetail {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_name: string;
  items: SaleItem[];
}

interface SaleItem {
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  size: string;
  color: string;
  sku: string;
}

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('http://localhost/shoe-store-pos/backend/api/sales.php');
      setSales(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: number) => {
    try {
      const response = await axios.get(`http://localhost/shoe-store-pos/backend/api/sales.php?id=${saleId}`);
      setSelectedSale(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      alert('Error loading sale details.');
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !dateFilter || 
      new Date(sale.created_at).toDateString() === new Date(dateFilter).toDateString();

    return matchesSearch && matchesDate;
  });

  const getTotalRevenue = () => {
    return filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
  };

  const printReceipt = () => {
    if (!selectedSale) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${selectedSale.sale_number}</title>
        <style>
          body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>👟 SHOE STORE POS</h2>
          <p>Receipt #${selectedSale.sale_number}</p>
          <p>${new Date(selectedSale.created_at).toLocaleString()}</p>
        </div>
        
        <div class="line"></div>
        
        <p><strong>Customer:</strong> ${selectedSale.customer_name || 'Walk-in Customer'}</p>
        ${selectedSale.customer_phone ? `<p><strong>Phone:</strong> ${selectedSale.customer_phone}</p>` : ''}
        <p><strong>Cashier:</strong> ${selectedSale.cashier_name}</p>
        
        <div class="line"></div>
        
        <h3>Items:</h3>
        ${selectedSale.items.map(item => `
          <div>
            <div class="row">
              <span>${item.product_name}</span>
              <span>$${item.total_price.toFixed(2)}</span>
            </div>
            <div style="font-size: 0.9em; color: #666;">
              Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}
            </div>
          </div>
        `).join('')}
        
        <div class="line"></div>
        
        <div class="row"><span>Subtotal:</span><span>$${selectedSale.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Tax:</span><span>$${selectedSale.tax_amount.toFixed(2)}</span></div>
        <div class="row"><span>Discount:</span><span>-$${selectedSale.discount_amount.toFixed(2)}</span></div>
        <div class="row total"><span>Total:</span><span>$${selectedSale.total_amount.toFixed(2)}</span></div>
        
        <div class="line"></div>
        
        <p><strong>Payment:</strong> ${selectedSale.payment_method.toUpperCase()}</p>
        
        <div class="header" style="margin-top: 30px;">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading sales history...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Sales History</h1>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{filteredSales.length}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-value">${getTotalRevenue().toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        
        <div className="stat-card orange">
          <div className="stat-value">
            ${filteredSales.length > 0 ? (getTotalRevenue() / filteredSales.length).toFixed(2) : '0.00'}
          </div>
          <div className="stat-label">Average Sale</div>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-col">
            <input
              type="text"
              className="form-control"
              placeholder="Search by sale number, customer, or cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-col">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
            }}
          >
            Clear Filters
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Sale #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.sale_number}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                <td>{sale.customer_name || 'Walk-in Customer'}</td>
                <td>{sale.cashier_name}</td>
                <td>${parseFloat(sale.total_amount.toString()).toFixed(2)}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    backgroundColor: 
                      sale.payment_method === 'cash' ? '#e8f5e8' :
                      sale.payment_method === 'card' ? '#e8f0ff' : '#fff3e0',
                    color:
                      sale.payment_method === 'cash' ? '#2e7d32' :
                      sale.payment_method === 'card' ? '#1565c0' : '#ef6c00'
                  }}>
                    {sale.payment_method.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    backgroundColor: sale.status === 'completed' ? '#e8f5e8' : '#ffebee',
                    color: sale.status === 'completed' ? '#2e7d32' : '#c62828'
                  }}>
                    {sale.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                    onClick={() => fetchSaleDetails(sale.id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSales.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            No sales found matching your criteria.
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Sale Details - {selectedSale.sale_number}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div>
              {/* Sale Information */}
              <div className="grid grid-2" style={{ marginBottom: '20px' }}>
                <div>
                  <h4>Sale Information</h4>
                  <p><strong>Date:</strong> {new Date(selectedSale.created_at).toLocaleString()}</p>
                  <p><strong>Cashier:</strong> {selectedSale.cashier_name}</p>
                  <p><strong>Payment Method:</strong> {selectedSale.payment_method.toUpperCase()}</p>
                  <p><strong>Status:</strong> {selectedSale.status.toUpperCase()}</p>
                </div>
                
                <div>
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedSale.customer_name || 'Walk-in Customer'}</p>
                  {selectedSale.customer_phone && (
                    <p><strong>Phone:</strong> {selectedSale.customer_phone}</p>
                  )}
                  {selectedSale.customer_email && (
                    <p><strong>Email:</strong> {selectedSale.customer_email}</p>
                  )}
                </div>
              </div>

              {/* Sale Items */}
              <h4>Items Purchased</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>{item.size}</td>
                      <td>{item.color}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>${item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sale Summary */}
              <div className="cart-total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${selectedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax:</span>
                  <span>${selectedSale.tax_amount.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span>
                  <span>-${selectedSale.discount_amount.toFixed(2)}</span>
                </div>
                <div className="total-row final">
                  <span>Total:</span>
                  <span>${selectedSale.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={printReceipt}>
                  🖨️ Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
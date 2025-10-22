import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardStats {
  totalSales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockItems: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockItems: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch products for stats
      const productsResponse = await axios.get('http://localhost/shoe-store-pos/backend/api/products.php');
      const products = productsResponse.data;

      // Fetch recent sales
      const salesResponse = await axios.get('http://localhost/shoe-store-pos/backend/api/sales.php');
      const sales = salesResponse.data;

      // Calculate stats
      const totalProducts = products.length;
      const lowStockItems = products.filter((product: any) => product.total_stock < 10).length;
      const todayRevenue = sales
        .filter((sale: any) => new Date(sale.created_at).toDateString() === new Date().toDateString())
        .reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount), 0);

      setStats({
        totalSales: sales.length,
        todayRevenue,
        totalProducts,
        lowStockItems
      });

      setRecentSales(sales.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{stats.totalSales}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-value">${stats.todayRevenue.toFixed(2)}</div>
          <div className="stat-label">Today's Revenue</div>
        </div>
        
        <div className="stat-card orange">
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.lowStockItems}</div>
          <div className="stat-label">Low Stock Items</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales</h3>
          </div>
          
          {recentSales.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Sale #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.sale_number}</td>
                    <td>{sale.customer_name || 'Walk-in Customer'}</td>
                    <td>${parseFloat(sale.total_amount).toFixed(2)}</td>
                    <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No recent sales found.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <a href="/sales" className="btn btn-primary">
              🛒 New Sale
            </a>
            <a href="/products" className="btn btn-success">
              ➕ Add Product
            </a>
            <a href="/reports" className="btn btn-warning">
              📊 View Reports
            </a>
            <a href="/sales-history" className="btn btn-secondary">
              📋 Sales History
            </a>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Today's Summary</h3>
        </div>
        
        <div className="grid grid-3">
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#3498db', marginBottom: '10px' }}>Sales Count</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {recentSales.filter(sale => 
                new Date(sale.created_at).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#27ae60', marginBottom: '10px' }}>Revenue</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${stats.todayRevenue.toFixed(2)}
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#e74c3c', marginBottom: '10px' }}>Avg. Sale</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              ${stats.todayRevenue > 0 ? 
                (stats.todayRevenue / Math.max(1, recentSales.filter(sale => 
                  new Date(sale.created_at).toDateString() === new Date().toDateString()
                ).length)).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
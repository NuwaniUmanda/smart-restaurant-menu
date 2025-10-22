import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SalesReport {
  sale_date: string;
  total_sales: number;
  total_revenue: number;
  average_sale: number;
}

const Reports: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    
    fetchSalesReport(thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  }, []);

  const fetchSalesReport = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('report', 'true');
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);

      const response = await axios.get(`http://localhost/shoe-store-pos/backend/api/sales.php?${params}`);
      setSalesReport(response.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    if (startDate && endDate) {
      fetchSalesReport(startDate, endDate);
    }
  };

  const getTotalStats = () => {
    return salesReport.reduce(
      (acc, day) => ({
        totalSales: acc.totalSales + day.total_sales,
        totalRevenue: acc.totalRevenue + day.total_revenue,
        totalDays: acc.totalDays + 1
      }),
      { totalSales: 0, totalRevenue: 0, totalDays: 0 }
    );
  };

  const stats = getTotalStats();

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Total Sales', 'Total Revenue', 'Average Sale'],
      ...salesReport.map(row => [
        row.sale_date,
        row.total_sales,
        row.total_revenue.toFixed(2),
        row.average_sale.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title">Reports & Analytics</h1>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{stats.totalSales}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card green">
          <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        
        <div className="stat-card orange">
          <div className="stat-value">
            ${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}
          </div>
          <div className="stat-label">Average Sale Value</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">
            ${stats.totalDays > 0 ? (stats.totalRevenue / stats.totalDays).toFixed(2) : '0.00'}
          </div>
          <div className="stat-label">Daily Average Revenue</div>
        </div>
      </div>

      {/* Report Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Sales Report</h3>
        </div>

        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-col">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="form-col">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            
            <button
              className="btn btn-success"
              onClick={exportToCSV}
              disabled={salesReport.length === 0}
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Loading report data...
          </div>
        ) : (
          <>
            {salesReport.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Sales</th>
                    <th>Total Revenue</th>
                    <th>Average Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.map((row) => (
                    <tr key={row.sale_date}>
                      <td>{new Date(row.sale_date).toLocaleDateString()}</td>
                      <td>{row.total_sales}</td>
                      <td>${parseFloat(row.total_revenue.toString()).toFixed(2)}</td>
                      <td>${parseFloat(row.average_sale.toString()).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                    <td>TOTAL</td>
                    <td>{stats.totalSales}</td>
                    <td>${stats.totalRevenue.toFixed(2)}</td>
                    <td>${stats.totalSales > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(2) : '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                No sales data found for the selected date range.
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Report Buttons */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Reports</h3>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
              fetchSalesReport(today, today);
            }}
          >
            📅 Today
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              setStartDate(yesterdayStr);
              setEndDate(yesterdayStr);
              fetchSalesReport(yesterdayStr, yesterdayStr);
            }}
          >
            📅 Yesterday
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
              const weekAgoStr = weekAgo.toISOString().split('T')[0];
              const todayStr = today.toISOString().split('T')[0];
              setStartDate(weekAgoStr);
              setEndDate(todayStr);
              fetchSalesReport(weekAgoStr, todayStr);
            }}
          >
            📅 Last 7 Days
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
              const monthAgoStr = monthAgo.toISOString().split('T')[0];
              const todayStr = today.toISOString().split('T')[0];
              setStartDate(monthAgoStr);
              setEndDate(todayStr);
              fetchSalesReport(monthAgoStr, todayStr);
            }}
          >
            📅 Last 30 Days
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              const today = new Date();
              const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
              const todayStr = today.toISOString().split('T')[0];
              setStartDate(firstDayStr);
              setEndDate(todayStr);
              fetchSalesReport(firstDayStr, todayStr);
            }}
          >
            📅 This Month
          </button>
        </div>
      </div>

      {/* Performance Insights */}
      {salesReport.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Insights</h3>
          </div>

          <div className="grid grid-2">
            <div>
              <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>📈 Best Performing Day</h4>
              {(() => {
                const bestDay = salesReport.reduce((best, day) => 
                  day.total_revenue > best.total_revenue ? day : best
                );
                return (
                  <div>
                    <p><strong>Date:</strong> {new Date(bestDay.sale_date).toLocaleDateString()}</p>
                    <p><strong>Sales:</strong> {bestDay.total_sales}</p>
                    <p><strong>Revenue:</strong> ${bestDay.total_revenue.toFixed(2)}</p>
                  </div>
                );
              })()}
            </div>

            <div>
              <h4 style={{ color: '#e74c3c', marginBottom: '15px' }}>📉 Lowest Performing Day</h4>
              {(() => {
                const worstDay = salesReport.reduce((worst, day) => 
                  day.total_revenue < worst.total_revenue ? day : worst
                );
                return (
                  <div>
                    <p><strong>Date:</strong> {new Date(worstDay.sale_date).toLocaleDateString()}</p>
                    <p><strong>Sales:</strong> {worstDay.total_sales}</p>
                    <p><strong>Revenue:</strong> ${worstDay.total_revenue.toFixed(2)}</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
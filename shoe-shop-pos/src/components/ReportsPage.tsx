import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Package,
  Users,
  Download
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface SalesData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingShoes: Array<{
    shoe: any;
    quantity: number;
    revenue: number;
  }>;
  salesByDay: Array<{
    date: Date;
    sales: number;
    revenue: number;
  }>;
}

const ReportsPage: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSalesData();
  }, [dateRange]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(new Date(dateRange.start));
      const endDate = endOfDay(new Date(dateRange.end));
      
      const data = await dataService.getSalesAnalytics(startDate, endDate);
      setSalesData(data);
    } catch (error) {
      console.error('Failed to load sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
  }> = ({ title, value, icon, trend, trendUp }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${!trendUp ? 'rotate-180' : ''}`} />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {salesData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Sales"
              value={salesData.totalSales.toString()}
              icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
            />
            <StatCard
              title="Total Revenue"
              value={`$${salesData.totalRevenue.toFixed(2)}`}
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
            />
            <StatCard
              title="Average Order Value"
              value={`$${salesData.averageOrderValue.toFixed(2)}`}
              icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            />
            <StatCard
              title="Items Sold"
              value={salesData.topSellingShoes.reduce((sum, item) => sum + item.quantity, 0).toString()}
              icon={<Package className="w-6 h-6 text-orange-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Shoes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Top Selling Shoes</h2>
              <div className="space-y-4">
                {salesData.topSellingShoes.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.shoe.name}</p>
                        <p className="text-xs text-gray-600">{item.shoe.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{item.quantity} sold</p>
                      <p className="text-xs text-gray-600">${item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Sales</h2>
              <div className="space-y-3">
                {salesData.salesByDay.slice(-7).map((day, index) => {
                  const maxRevenue = Math.max(...salesData.salesByDay.map(d => d.revenue));
                  const barWidth = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="w-20 text-sm text-gray-600">
                        {format(day.date, 'MMM dd')}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-blue-600 h-4 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{day.sales} sales</p>
                        <p className="text-xs text-gray-600">${day.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Additional Analytics */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales by Category */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
              <div className="space-y-3">
                {['men', 'women', 'kids', 'unisex'].map((category) => {
                  const categoryShoes = salesData.topSellingShoes.filter(
                    item => item.shoe.category === category
                  );
                  const categoryTotal = categoryShoes.reduce((sum, item) => sum + item.quantity, 0);
                  const totalSold = salesData.topSellingShoes.reduce((sum, item) => sum + item.quantity, 0);
                  const percentage = totalSold > 0 ? (categoryTotal / totalSold) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {categoryTotal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-orange-600">Low Stock Alert</h2>
              <LowStockAlert />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-3 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Export Sales Data</p>
                      <p className="text-xs text-gray-600">Download CSV report</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-3 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Inventory Report</p>
                      <p className="text-xs text-gray-600">View stock levels</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-3 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Customer Report</p>
                      <p className="text-xs text-gray-600">Analyze customer data</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Low Stock Alert Component
const LowStockAlert: React.FC = () => {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    loadLowStockItems();
  }, []);

  const loadLowStockItems = async () => {
    try {
      const inventory = await dataService.getInventoryStatus();
      const lowStock = inventory.filter(item => item.lowStock).slice(0, 5);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Failed to load low stock items:', error);
    }
  };

  if (lowStockItems.length === 0) {
    return (
      <div className="text-center py-4">
        <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-green-600">All items are well stocked!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lowStockItems.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
          <div>
            <p className="text-sm font-medium">{item.shoe.name}</p>
            <p className="text-xs text-gray-600">Size {item.size}</p>
          </div>
          <span className="text-sm font-bold text-orange-600">
            {item.stock} left
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReportsPage;
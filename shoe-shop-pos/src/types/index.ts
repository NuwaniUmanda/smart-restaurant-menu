// Product/Shoe Types
export interface Shoe {
  id: string;
  name: string;
  brand: string;
  category: 'men' | 'women' | 'kids' | 'unisex';
  type: 'sneakers' | 'boots' | 'sandals' | 'dress' | 'casual' | 'athletic';
  color: string;
  material: string;
  sizes: ShoeSize[];
  basePrice: number;
  images: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoeSize {
  size: string; // e.g., "8", "8.5", "9"
  stock: number;
  sku: string;
}

// Customer Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: Address;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: Date;
  lastPurchase?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Sales/Transaction Types
export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  cashierId: string;
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface SaleItem {
  id: string;
  shoeId: string;
  shoeName: string;
  brand: string;
  size: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'digital';
  details?: {
    cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
    last4?: string;
    transactionId?: string;
  };
  amount: number;
}

// Cart Types
export interface CartItem {
  shoe: Shoe;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

// Employee/User Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'cashier' | 'manager' | 'admin';
  isActive: boolean;
  createdAt: Date;
}

// Inventory Types
export interface InventoryItem {
  shoeId: string;
  size: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  lastRestocked?: Date;
  supplier?: string;
}

// Report Types
export interface SalesReport {
  period: {
    start: Date;
    end: Date;
  };
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingShoes: Array<{
    shoe: Shoe;
    quantitySold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: Date;
    sales: number;
    revenue: number;
  }>;
}

// UI State Types
export interface UIState {
  currentView: 'pos' | 'inventory' | 'customers' | 'reports' | 'settings';
  isLoading: boolean;
  error?: string;
  selectedCustomer?: Customer;
  cart: Cart;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
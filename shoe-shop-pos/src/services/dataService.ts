import { v4 as uuidv4 } from 'uuid';
import { 
  Shoe, 
  Customer, 
  Sale, 
  SaleItem, 
  Employee, 
  InventoryItem, 
  CartItem,
  PaymentMethod 
} from '../types';

// Mock data storage (in a real app, this would be a database)
class DataService {
  private shoes: Shoe[] = [];
  private customers: Customer[] = [];
  private sales: Sale[] = [];
  private employees: Employee[] = [];
  private inventory: InventoryItem[] = [];

  constructor() {
    this.initializeMockData();
  }

  // Initialize with sample data
  private initializeMockData() {
    // Sample shoes
    this.shoes = [
      {
        id: '1',
        name: 'Air Max 90',
        brand: 'Nike',
        category: 'unisex',
        type: 'sneakers',
        color: 'White/Black',
        material: 'Leather/Mesh',
        sizes: [
          { size: '7', stock: 5, sku: 'NIKE-AM90-WB-7' },
          { size: '8', stock: 3, sku: 'NIKE-AM90-WB-8' },
          { size: '9', stock: 7, sku: 'NIKE-AM90-WB-9' },
          { size: '10', stock: 2, sku: 'NIKE-AM90-WB-10' },
        ],
        basePrice: 129.99,
        images: ['/images/nike-air-max-90.jpg'],
        description: 'Classic Nike Air Max 90 with iconic visible air cushioning.',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        name: 'Chuck Taylor All Star',
        brand: 'Converse',
        category: 'unisex',
        type: 'casual',
        color: 'Black',
        material: 'Canvas',
        sizes: [
          { size: '6', stock: 4, sku: 'CONV-CT-BK-6' },
          { size: '7', stock: 6, sku: 'CONV-CT-BK-7' },
          { size: '8', stock: 8, sku: 'CONV-CT-BK-8' },
          { size: '9', stock: 5, sku: 'CONV-CT-BK-9' },
          { size: '10', stock: 3, sku: 'CONV-CT-BK-10' },
        ],
        basePrice: 65.00,
        images: ['/images/converse-chuck-taylor.jpg'],
        description: 'Timeless Converse Chuck Taylor All Star high-top sneakers.',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: '3',
        name: 'Stan Smith',
        brand: 'Adidas',
        category: 'unisex',
        type: 'sneakers',
        color: 'White/Green',
        material: 'Leather',
        sizes: [
          { size: '7', stock: 6, sku: 'ADIDAS-SS-WG-7' },
          { size: '8', stock: 4, sku: 'ADIDAS-SS-WG-8' },
          { size: '9', stock: 8, sku: 'ADIDAS-SS-WG-9' },
          { size: '10', stock: 2, sku: 'ADIDAS-SS-WG-10' },
          { size: '11', stock: 3, sku: 'ADIDAS-SS-WG-11' },
        ],
        basePrice: 89.99,
        images: ['/images/adidas-stan-smith.jpg'],
        description: 'Classic Adidas Stan Smith tennis shoes with green accents.',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
      },
    ];

    // Sample customers
    this.customers = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '(555) 123-4567',
        loyaltyPoints: 150,
        totalPurchases: 3,
        createdAt: new Date('2024-01-01'),
        lastPurchase: new Date('2024-01-20'),
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com',
        phone: '(555) 987-6543',
        loyaltyPoints: 75,
        totalPurchases: 1,
        createdAt: new Date('2024-01-05'),
        lastPurchase: new Date('2024-01-15'),
      },
    ];

    // Sample employee
    this.employees = [
      {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@shoeshop.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ];
  }

  // Shoe operations
  async getShoes(): Promise<Shoe[]> {
    return [...this.shoes];
  }

  async getShoeById(id: string): Promise<Shoe | null> {
    return this.shoes.find(shoe => shoe.id === id) || null;
  }

  async addShoe(shoe: Omit<Shoe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shoe> {
    const newShoe: Shoe = {
      ...shoe,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shoes.push(newShoe);
    return newShoe;
  }

  async updateShoe(id: string, updates: Partial<Shoe>): Promise<Shoe | null> {
    const index = this.shoes.findIndex(shoe => shoe.id === id);
    if (index === -1) return null;

    this.shoes[index] = {
      ...this.shoes[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.shoes[index];
  }

  async deleteShoe(id: string): Promise<boolean> {
    const index = this.shoes.findIndex(shoe => shoe.id === id);
    if (index === -1) return false;

    this.shoes.splice(index, 1);
    return true;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return [...this.customers];
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customers.find(customer => customer.id === id) || null;
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index === -1) return null;

    this.customers[index] = {
      ...this.customers[index],
      ...updates,
    };
    return this.customers[index];
  }

  // Sale operations
  async getSales(): Promise<Sale[]> {
    return [...this.sales];
  }

  async getSaleById(id: string): Promise<Sale | null> {
    return this.sales.find(sale => sale.id === id) || null;
  }

  async createSale(
    items: CartItem[],
    customerId: string | undefined,
    paymentMethod: PaymentMethod,
    cashierId: string,
    discount: number = 0
  ): Promise<Sale> {
    const saleItems: SaleItem[] = items.map(item => ({
      id: uuidv4(),
      shoeId: item.shoe.id,
      shoeName: item.shoe.name,
      brand: item.shoe.brand,
      size: item.size,
      sku: item.shoe.sizes.find(s => s.size === item.size)?.sku || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: 0,
      total: item.total,
    }));

    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + tax - discount;

    const sale: Sale = {
      id: uuidv4(),
      customerId,
      items: saleItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      status: 'completed',
      cashierId,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    this.sales.push(sale);

    // Update inventory
    for (const item of items) {
      await this.updateInventory(item.shoe.id, item.size, -item.quantity);
    }

    // Update customer loyalty points if customer exists
    if (customerId) {
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const pointsEarned = Math.floor(total / 10); // 1 point per $10 spent
        await this.updateCustomer(customerId, {
          loyaltyPoints: customer.loyaltyPoints + pointsEarned,
          totalPurchases: customer.totalPurchases + 1,
          lastPurchase: new Date(),
        });
      }
    }

    return sale;
  }

  // Inventory operations
  async updateInventory(shoeId: string, size: string, quantityChange: number): Promise<boolean> {
    const shoe = await this.getShoeById(shoeId);
    if (!shoe) return false;

    const sizeIndex = shoe.sizes.findIndex(s => s.size === size);
    if (sizeIndex === -1) return false;

    shoe.sizes[sizeIndex].stock += quantityChange;
    if (shoe.sizes[sizeIndex].stock < 0) {
      shoe.sizes[sizeIndex].stock = 0;
    }

    await this.updateShoe(shoeId, { sizes: shoe.sizes });
    return true;
  }

  async getInventoryStatus(): Promise<Array<{ shoe: Shoe; size: string; stock: number; lowStock: boolean }>> {
    const inventory: Array<{ shoe: Shoe; size: string; stock: number; lowStock: boolean }> = [];
    
    for (const shoe of this.shoes) {
      for (const size of shoe.sizes) {
        inventory.push({
          shoe,
          size: size.size,
          stock: size.stock,
          lowStock: size.stock <= 2, // Consider low stock if 2 or fewer items
        });
      }
    }

    return inventory;
  }

  // Search operations
  async searchShoes(query: string): Promise<Shoe[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.shoes.filter(shoe => 
      shoe.name.toLowerCase().includes(lowercaseQuery) ||
      shoe.brand.toLowerCase().includes(lowercaseQuery) ||
      shoe.color.toLowerCase().includes(lowercaseQuery) ||
      shoe.type.toLowerCase().includes(lowercaseQuery)
    );
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.customers.filter(customer =>
      customer.firstName.toLowerCase().includes(lowercaseQuery) ||
      customer.lastName.toLowerCase().includes(lowercaseQuery) ||
      customer.email?.toLowerCase().includes(lowercaseQuery) ||
      customer.phone?.includes(query)
    );
  }

  // Analytics operations
  async getSalesAnalytics(startDate: Date, endDate: Date) {
    const salesInPeriod = this.sales.filter(sale => 
      sale.createdAt >= startDate && sale.createdAt <= endDate
    );

    const totalSales = salesInPeriod.length;
    const totalRevenue = salesInPeriod.reduce((sum, sale) => sum + sale.total, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top selling shoes
    const shoesSold: { [key: string]: { quantity: number; revenue: number; shoe: Shoe } } = {};
    
    for (const sale of salesInPeriod) {
      for (const item of sale.items) {
        if (!shoesSold[item.shoeId]) {
          const shoe = await this.getShoeById(item.shoeId);
          if (shoe) {
            shoesSold[item.shoeId] = { quantity: 0, revenue: 0, shoe };
          }
        }
        if (shoesSold[item.shoeId]) {
          shoesSold[item.shoeId].quantity += item.quantity;
          shoesSold[item.shoeId].revenue += item.total;
        }
      }
    }

    const topSellingShoes = Object.values(shoesSold)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      topSellingShoes,
      salesByDay: this.groupSalesByDay(salesInPeriod),
    };
  }

  private groupSalesByDay(sales: Sale[]) {
    const salesByDay: { [key: string]: { sales: number; revenue: number } } = {};
    
    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDay[dateKey]) {
        salesByDay[dateKey] = { sales: 0, revenue: 0 };
      }
      salesByDay[dateKey].sales += 1;
      salesByDay[dateKey].revenue += sale.total;
    }

    return Object.entries(salesByDay).map(([date, data]) => ({
      date: new Date(date),
      ...data,
    }));
  }
}

// Export singleton instance
export const dataService = new DataService();
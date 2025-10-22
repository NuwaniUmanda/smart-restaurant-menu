# Shoe Shop Point of Sale (POS) System

A comprehensive Point of Sale system designed specifically for shoe shops, built with React, TypeScript, and Tailwind CSS.

## Features

### 🛒 Point of Sale Interface
- **Product Catalog**: Browse and search through shoe inventory
- **Shopping Cart**: Add/remove items, adjust quantities
- **Customer Selection**: Optional customer association for loyalty tracking
- **Multiple Payment Methods**: Cash, Credit/Debit Card support
- **Real-time Stock Updates**: Automatic inventory adjustment after sales

### 📦 Inventory Management
- **Product Management**: Add, edit, and delete shoe products
- **Size & Stock Tracking**: Manage multiple sizes per shoe with individual stock levels
- **Low Stock Alerts**: Visual indicators for items running low
- **Advanced Filtering**: Search by name, brand, category, or stock status
- **SKU Management**: Unique identifiers for each size variant

### 👥 Customer Management
- **Customer Database**: Store customer information and purchase history
- **Loyalty Program**: Points system with customer tiers (Bronze, Silver, Gold)
- **Purchase Tracking**: Monitor customer buying patterns
- **Contact Management**: Email and phone number storage

### 📊 Reports & Analytics
- **Sales Reports**: Daily, weekly, monthly sales analysis
- **Top Selling Products**: Identify best-performing shoes
- **Revenue Tracking**: Monitor income and growth trends
- **Customer Analytics**: Understand customer behavior
- **Low Stock Reports**: Inventory management insights

### ⚙️ Settings & Configuration
- **Store Information**: Customize store details
- **Tax Configuration**: Adjustable tax rates
- **Receipt Settings**: Print and email options
- **Inventory Thresholds**: Configure low stock alerts

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Date Handling**: date-fns
- **Build Tool**: Create React App

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shoe-shop-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application.

### Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Project Structure

```
src/
├── components/           # React components
│   ├── Navigation.tsx    # Main navigation sidebar
│   ├── POSInterface.tsx  # Point of sale interface
│   ├── InventoryManagement.tsx  # Inventory management
│   ├── CustomerManagement.tsx   # Customer database
│   └── ReportsPage.tsx   # Analytics and reports
├── context/             # React Context for state management
│   └── POSContext.tsx   # Main application state
├── services/            # Business logic and data services
│   └── dataService.ts   # Data management service
├── types/               # TypeScript type definitions
│   └── index.ts         # All application types
└── App.tsx              # Main application component
```

## Key Components

### Data Models
- **Shoe**: Product information with sizes, stock, and pricing
- **Customer**: Customer details with loyalty tracking
- **Sale**: Transaction records with items and payment info
- **CartItem**: Shopping cart item structure

### Services
- **DataService**: Handles all data operations (CRUD operations)
- **Analytics**: Sales reporting and inventory analysis

## Sample Data

The application comes with pre-loaded sample data including:
- Popular shoe brands (Nike, Adidas, Converse)
- Sample customers with purchase history
- Various shoe categories and sizes

## Usage Guide

### Making a Sale
1. Navigate to the POS interface
2. Search and select shoes to add to cart
3. Choose sizes and quantities
4. Optionally select a customer for loyalty points
5. Proceed to payment and complete the transaction

### Managing Inventory
1. Go to Inventory Management
2. Add new shoes with sizes and stock levels
3. Edit existing products as needed
4. Monitor low stock alerts

### Customer Management
1. Access Customer Management section
2. Add new customers or edit existing ones
3. View customer purchase history and loyalty status
4. Track customer tiers and points

### Viewing Reports
1. Navigate to Reports section
2. Select date ranges for analysis
3. Review sales performance and trends
4. Export data for external analysis

## Customization

### Adding New Shoe Categories
Edit the `Shoe` type in `src/types/index.ts` to add new categories:

```typescript
category: 'men' | 'women' | 'kids' | 'unisex' | 'your-new-category';
```

### Modifying Tax Rates
Update the tax calculation in `src/services/dataService.ts`:

```typescript
const tax = subtotal * 0.08; // Change 0.08 to your tax rate
```

### Customizing Loyalty Points
Modify the points calculation in the `createSale` method:

```typescript
const pointsEarned = Math.floor(total / 10); // 1 point per $10 spent
```

## Future Enhancements

- **Database Integration**: Replace in-memory storage with a real database
- **User Authentication**: Add employee login and role-based access
- **Receipt Printing**: Integrate with thermal printers
- **Barcode Scanning**: Add barcode scanner support
- **Online Integration**: Connect with e-commerce platforms
- **Advanced Reporting**: More detailed analytics and insights
- **Multi-location Support**: Support for multiple store locations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Note**: This is a demonstration POS system. For production use, ensure proper security measures, data backup, and compliance with local regulations.
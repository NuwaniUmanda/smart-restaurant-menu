# 👟 Shoe Store POS System

A comprehensive Point of Sale (POS) system for shoe stores built with PHP backend, React frontend, and MySQL database.

## 🚀 Features

### Core Features
- **Sales Processing**: Complete sales transactions with cart management
- **Product Management**: Add, edit, delete products with variants (size, color)
- **Inventory Management**: Track stock levels and low stock alerts
- **Sales History**: View detailed sales records and receipts
- **Reporting & Analytics**: Generate sales reports with date filtering
- **Receipt Printing**: Print professional receipts for customers

### Advanced Features
- **Multi-variant Products**: Support for different sizes and colors
- **Customer Information**: Store customer details for sales
- **Payment Methods**: Support for cash, card, and digital payments
- **Tax Calculation**: Automatic tax calculation (8% default)
- **Discount System**: Apply discounts to sales
- **Stock Movement Tracking**: Track inventory movements
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Backend**: PHP 7.4+ with PDO
- **Frontend**: React 18 with TypeScript
- **Database**: MySQL 5.7+
- **Styling**: Custom CSS with modern design
- **HTTP Client**: Axios for API communication

## 📋 Prerequisites

Before installation, ensure you have:

- **PHP 7.4 or higher** with extensions:
  - PDO
  - PDO_MySQL
  - JSON
- **MySQL 5.7 or higher**
- **Node.js 16 or higher**
- **npm or yarn**
- **Web server** (Apache/Nginx) or PHP built-in server

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd shoe-store-pos
```

### Step 2: Database Setup

1. **Create MySQL Database:**
```sql
CREATE DATABASE shoe_store_pos;
```

2. **Import Database Schema:**
```bash
mysql -u root -p shoe_store_pos < database/schema.sql
```

3. **Configure Database Connection:**
Edit `backend/config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'shoe_store_pos';
private $username = 'your_username';
private $password = 'your_password';
```

### Step 3: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Start PHP development server:**
```bash
php -S localhost:8000
```

Or configure your web server to serve the `backend` directory.

### Step 4: Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure API endpoint (if needed):**
Edit API calls in components to match your backend URL (default: `http://localhost/shoe-store-pos/backend/api/`)

4. **Start development server:**
```bash
npm start
```

The application will open at `http://localhost:3000`

## 🎯 Usage Commands

### Development Commands

#### Backend Commands
```bash
# Start PHP development server
cd backend
php -S localhost:8000

# Check PHP version
php --version

# Test database connection
php -r "
$pdo = new PDO('mysql:host=localhost;dbname=shoe_store_pos', 'username', 'password');
echo 'Database connected successfully!';
"
```

#### Frontend Commands
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for updates
npm outdated

# Update dependencies
npm update
```

### Database Commands

```bash
# Backup database
mysqldump -u root -p shoe_store_pos > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p shoe_store_pos < backup_file.sql

# Reset database (WARNING: This will delete all data)
mysql -u root -p shoe_store_pos < database/schema.sql
```

### Production Deployment Commands

```bash
# Build React app for production
cd frontend
npm run build

# Copy build files to web server
cp -r build/* /var/www/html/shoe-store-pos/

# Set proper permissions (Linux/Mac)
sudo chown -R www-data:www-data /var/www/html/shoe-store-pos/
sudo chmod -R 755 /var/www/html/shoe-store-pos/
```

## 🔐 Default Login Credentials

- **Username**: admin
- **Password**: password

- **Username**: cashier1  
- **Password**: password

## 📁 Project Structure

```
shoe-store-pos/
├── backend/
│   ├── api/
│   │   ├── products.php      # Product CRUD operations
│   │   ├── sales.php         # Sales processing
│   │   ├── categories.php    # Category management
│   │   └── brands.php        # Brand management
│   ├── config/
│   │   ├── database.php      # Database configuration
│   │   └── cors.php          # CORS headers
│   └── models/
│       ├── Product.php       # Product model
│       └── Sale.php          # Sale model
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SalesPage.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   ├── SalesHistory.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── database/
│   └── schema.sql            # Database schema
└── README.md
```

## 🔄 API Endpoints

### Products API
- `GET /api/products.php` - Get all products
- `GET /api/products.php?id={id}` - Get single product with variants
- `GET /api/products.php?search={term}` - Search products
- `POST /api/products.php` - Create new product
- `PUT /api/products.php` - Update product
- `DELETE /api/products.php` - Delete product

### Sales API
- `GET /api/sales.php` - Get all sales
- `GET /api/sales.php?id={id}` - Get single sale with items
- `GET /api/sales.php?report=true&start_date={date}&end_date={date}` - Get sales report
- `POST /api/sales.php` - Create new sale

### Categories API
- `GET /api/categories.php` - Get all categories
- `POST /api/categories.php` - Create new category

### Brands API
- `GET /api/brands.php` - Get all brands
- `POST /api/brands.php` - Create new brand

## 🎨 Customization

### Adding New Product Variants
1. Modify the `product_variants` table schema
2. Update the Product model in `backend/models/Product.php`
3. Update frontend components to handle new variant types

### Changing Tax Rate
Edit the tax calculation in `frontend/src/components/SalesPage.tsx`:
```typescript
const calculateTax = () => {
    return calculateSubtotal() * 0.08; // Change 0.08 to your tax rate
};
```

### Adding New Payment Methods
1. Update the `sales` table enum for `payment_method`
2. Add new options in the frontend payment method dropdown

### Customizing Receipt Template
Edit the `printReceipt` function in `frontend/src/components/SalesHistory.tsx`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check database credentials in `backend/config/database.php`
   - Ensure MySQL service is running
   - Verify database exists

2. **CORS Errors**
   - Check `backend/config/cors.php` settings
   - Ensure frontend URL is allowed in CORS headers

3. **API Not Working**
   - Check PHP error logs
   - Verify web server configuration
   - Test API endpoints directly

4. **Frontend Build Fails**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Debug Commands

```bash
# Check PHP errors
tail -f /var/log/php_errors.log

# Test API endpoint
curl -X GET http://localhost/shoe-store-pos/backend/api/products.php

# Check React console for errors
# Open browser developer tools (F12)
```

## 📊 Sample Data

The system comes with pre-loaded sample data including:
- 6 product categories (Running Shoes, Casual Shoes, etc.)
- 6 popular brands (Nike, Adidas, Puma, etc.)
- 5 sample products with multiple variants
- 2 user accounts (admin and cashier)

## 🔒 Security Features

- SQL injection protection using PDO prepared statements
- CORS configuration for secure API access
- Input validation and sanitization
- Password hashing for user accounts

## 📈 Performance Optimization

- Efficient database queries with proper indexing
- Lazy loading of product variants
- Optimized React components with proper state management
- Responsive design for mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Happy Selling! 👟💰**
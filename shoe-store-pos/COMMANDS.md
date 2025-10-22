# 🚀 Shoe Store POS - Command Reference

This document provides a comprehensive list of commands to set up, run, and manage your Shoe Store POS system.

## 📋 Quick Start Commands

### Complete Setup (First Time)
```bash
# 1. Navigate to project directory
cd shoe-store-pos

# 2. Set up database
mysql -u root -p -e "CREATE DATABASE shoe_store_pos;"
mysql -u root -p shoe_store_pos < database/schema.sql

# 3. Start backend server
cd backend
php -S localhost:8000 &

# 4. Install and start frontend (in new terminal)
cd frontend
npm install
npm start
```

### Daily Development Commands
```bash
# Start backend server
cd backend && php -S localhost:8000

# Start frontend development server
cd frontend && npm start

# Both servers will be running:
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

## 🗄️ Database Commands

### Initial Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE shoe_store_pos;"

# Import schema with sample data
mysql -u root -p shoe_store_pos < database/schema.sql

# Verify database setup
mysql -u root -p shoe_store_pos -e "SHOW TABLES;"
```

### Database Management
```bash
# Backup database
mysqldump -u root -p shoe_store_pos > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u root -p shoe_store_pos < backup_file.sql

# Reset database (WARNING: Deletes all data)
mysql -u root -p shoe_store_pos < database/schema.sql

# Check database size
mysql -u root -p -e "
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'shoe_store_pos';"
```

### Database Queries for Testing
```bash
# Check products count
mysql -u root -p shoe_store_pos -e "SELECT COUNT(*) as product_count FROM products;"

# Check sales count
mysql -u root -p shoe_store_pos -e "SELECT COUNT(*) as sales_count FROM sales;"

# View recent sales
mysql -u root -p shoe_store_pos -e "
SELECT sale_number, customer_name, total_amount, created_at 
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;"

# Check low stock items
mysql -u root -p shoe_store_pos -e "
SELECT p.name, pv.size, pv.color, pv.stock_quantity 
FROM products p 
JOIN product_variants pv ON p.id = pv.product_id 
WHERE pv.stock_quantity < 10 
ORDER BY pv.stock_quantity ASC;"
```

## 🔧 Backend Commands

### Development Server
```bash
# Start PHP development server
cd backend
php -S localhost:8000

# Start with specific host/port
php -S 0.0.0.0:8080

# Start in background
php -S localhost:8000 > /dev/null 2>&1 &

# Kill background PHP server
pkill -f "php -S"
```

### Testing Backend APIs
```bash
# Test products API
curl -X GET http://localhost:8000/api/products.php

# Test specific product
curl -X GET "http://localhost:8000/api/products.php?id=1"

# Test search
curl -X GET "http://localhost:8000/api/products.php?search=nike"

# Test sales API
curl -X GET http://localhost:8000/api/sales.php

# Test categories API
curl -X GET http://localhost:8000/api/categories.php

# Test brands API
curl -X GET http://localhost:8000/api/brands.php
```

### Backend Maintenance
```bash
# Check PHP version
php --version

# Check PHP modules
php -m | grep -E "(pdo|mysql|json)"

# Test database connection
php -r "
try {
    \$pdo = new PDO('mysql:host=localhost;dbname=shoe_store_pos', 'root', 'password');
    echo 'Database connection successful!\n';
} catch (Exception \$e) {
    echo 'Connection failed: ' . \$e->getMessage() . '\n';
}"

# Check for PHP errors
tail -f /var/log/php_errors.log
```

## ⚛️ Frontend Commands

### Development
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Start on different port
PORT=3001 npm start

# Start and open browser
npm start && open http://localhost:3000
```

### Build & Production
```bash
# Build for production
npm run build

# Serve production build locally
npm install -g serve
serve -s build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### Testing & Quality
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Package Management
```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest

# Check security vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Clean install (removes node_modules)
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Production Deployment Commands

### Build for Production
```bash
# Build React app
cd frontend
npm run build

# Copy build to web server
sudo cp -r build/* /var/www/html/shoe-store-pos/

# Set permissions (Linux)
sudo chown -R www-data:www-data /var/www/html/shoe-store-pos/
sudo chmod -R 755 /var/www/html/shoe-store-pos/
```

### Apache Configuration
```bash
# Create Apache virtual host
sudo nano /etc/apache2/sites-available/shoe-store-pos.conf

# Content for virtual host:
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/shoe-store-pos
    
    <Directory /var/www/html/shoe-store-pos>
        AllowOverride All
        Require all granted
    </Directory>
    
    # PHP backend proxy
    ProxyPass /api/ http://localhost:8000/api/
    ProxyPassReverse /api/ http://localhost:8000/api/
</VirtualHost>

# Enable site
sudo a2ensite shoe-store-pos.conf
sudo systemctl reload apache2
```

### Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/shoe-store-pos

# Content for Nginx:
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/shoe-store-pos;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/shoe-store-pos /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## 🔍 Monitoring & Debugging Commands

### Log Monitoring
```bash
# Monitor PHP errors
tail -f /var/log/php_errors.log

# Monitor Apache access logs
tail -f /var/log/apache2/access.log

# Monitor Apache error logs
tail -f /var/log/apache2/error.log

# Monitor Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep -E "(php|node|mysql)"

# Check port usage
netstat -tulpn | grep -E "(3000|8000|80|443)"

# Check system load
top
htop
```

### Performance Testing
```bash
# Test API response time
time curl -X GET http://localhost:8000/api/products.php

# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:8000/api/products.php

# Test database performance
mysql -u root -p shoe_store_pos -e "
EXPLAIN SELECT p.*, b.name as brand_name, c.name as category_name 
FROM products p 
LEFT JOIN brands b ON p.brand_id = b.id 
LEFT JOIN categories c ON p.category_id = c.id;"
```

## 🛠️ Maintenance Commands

### Regular Maintenance
```bash
# Update system packages (Ubuntu/Debian)
sudo apt update && sudo apt upgrade

# Clean up old log files
sudo find /var/log -name "*.log" -mtime +30 -delete

# Optimize MySQL tables
mysql -u root -p shoe_store_pos -e "OPTIMIZE TABLE products, sales, product_variants, sale_items;"

# Clean npm cache
npm cache clean --force

# Clean React build cache
rm -rf frontend/node_modules/.cache
```

### Backup Scripts
```bash
# Create automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p shoe_store_pos > $BACKUP_DIR/db_backup_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz backend/ frontend/build/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make script executable
chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🔧 Troubleshooting Commands

### Common Issues
```bash
# Fix permission issues
sudo chown -R $USER:$USER shoe-store-pos/
chmod -R 755 shoe-store-pos/

# Reset npm
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install

# Clear browser cache and restart
# Chrome: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Check if ports are in use
lsof -i :3000
lsof -i :8000

# Kill processes on specific ports
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8000)
```

### Database Issues
```bash
# Reset MySQL root password
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'newpassword';"

# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check MySQL connections
mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 📊 Useful Queries

### Business Intelligence Queries
```bash
# Top selling products
mysql -u root -p shoe_store_pos -e "
SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.total_price) as revenue
FROM sale_items si
JOIN product_variants pv ON si.product_variant_id = pv.id
JOIN products p ON pv.product_id = p.id
GROUP BY p.id
ORDER BY total_sold DESC
LIMIT 10;"

# Sales by payment method
mysql -u root -p shoe_store_pos -e "
SELECT payment_method, COUNT(*) as count, SUM(total_amount) as revenue
FROM sales
GROUP BY payment_method;"

# Monthly sales report
mysql -u root -p shoe_store_pos -e "
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as sales_count,
    SUM(total_amount) as revenue
FROM sales
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;"
```

---

## 🎯 Quick Reference

### Most Used Commands
```bash
# Start development
cd backend && php -S localhost:8000 &
cd frontend && npm start

# Build for production
cd frontend && npm run build

# Backup database
mysqldump -u root -p shoe_store_pos > backup.sql

# Test API
curl -X GET http://localhost:8000/api/products.php
```

### Emergency Commands
```bash
# Stop all servers
pkill -f "php -S"
pkill -f "node.*react-scripts"

# Reset everything
mysql -u root -p shoe_store_pos < database/schema.sql
rm -rf frontend/node_modules && cd frontend && npm install
```

Save this file as a reference and customize the commands based on your specific environment and requirements!
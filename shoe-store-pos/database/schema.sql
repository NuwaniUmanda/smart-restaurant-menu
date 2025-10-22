-- Shoe Store POS Database Schema
CREATE DATABASE IF NOT EXISTS shoe_store_pos;
USE shoe_store_pos;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'cashier') DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (shoes)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand_id INT,
    category_id INT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Product variants (sizes, colors)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'digital') NOT NULL,
    status ENUM('pending', 'completed', 'refunded') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sale items table
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT,
    product_variant_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- Inventory movements table
CREATE TABLE inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_variant_id INT,
    movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(200),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (username, password, role) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'), -- password: password
('cashier1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier');

INSERT INTO categories (name, description) VALUES 
('Running Shoes', 'Athletic shoes for running and jogging'),
('Casual Shoes', 'Everyday comfortable shoes'),
('Formal Shoes', 'Business and formal occasion shoes'),
('Sneakers', 'Trendy casual sneakers'),
('Boots', 'Ankle and knee-high boots'),
('Sandals', 'Open-toe summer footwear');

INSERT INTO brands (name, description) VALUES 
('Nike', 'Leading athletic footwear brand'),
('Adidas', 'German multinational corporation'),
('Puma', 'Athletic and casual footwear'),
('Reebok', 'Fitness and lifestyle brand'),
('Converse', 'Classic sneaker brand'),
('Vans', 'Skateboarding and lifestyle shoes');

INSERT INTO products (name, brand_id, category_id, description, price, cost_price, image_url) VALUES 
('Air Max 270', 1, 1, 'Comfortable running shoes with air cushioning', 150.00, 90.00, 'https://via.placeholder.com/300x200?text=Air+Max+270'),
('Stan Smith', 2, 2, 'Classic white leather sneakers', 80.00, 50.00, 'https://via.placeholder.com/300x200?text=Stan+Smith'),
('Chuck Taylor All Star', 5, 4, 'Iconic canvas sneakers', 60.00, 35.00, 'https://via.placeholder.com/300x200?text=Chuck+Taylor'),
('Old Skool', 6, 4, 'Classic skate shoes with side stripe', 65.00, 40.00, 'https://via.placeholder.com/300x200?text=Old+Skool'),
('Classic Leather', 4, 2, 'Timeless leather casual shoes', 75.00, 45.00, 'https://via.placeholder.com/300x200?text=Classic+Leather');

INSERT INTO product_variants (product_id, size, color, stock_quantity, sku) VALUES 
(1, '8', 'Black', 10, 'AM270-8-BLK'),
(1, '9', 'Black', 15, 'AM270-9-BLK'),
(1, '10', 'Black', 8, 'AM270-10-BLK'),
(1, '8', 'White', 12, 'AM270-8-WHT'),
(1, '9', 'White', 20, 'AM270-9-WHT'),
(2, '8', 'White', 25, 'SS-8-WHT'),
(2, '9', 'White', 18, 'SS-9-WHT'),
(2, '10', 'White', 22, 'SS-10-WHT'),
(3, '8', 'Black', 30, 'CT-8-BLK'),
(3, '9', 'Black', 25, 'CT-9-BLK'),
(3, '8', 'White', 28, 'CT-8-WHT'),
(4, '8', 'Black', 15, 'OS-8-BLK'),
(4, '9', 'Black', 20, 'OS-9-BLK'),
(5, '8', 'Brown', 12, 'CL-8-BRN'),
(5, '9', 'Brown', 18, 'CL-9-BRN');
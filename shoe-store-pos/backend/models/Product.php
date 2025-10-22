<?php
class Product {
    private $conn;
    private $table_name = "products";

    public $id;
    public $name;
    public $brand_id;
    public $category_id;
    public $description;
    public $price;
    public $cost_price;
    public $image_url;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get all products with brand and category info
    public function read() {
        $query = "SELECT 
                    p.id, p.name, p.description, p.price, p.cost_price, p.image_url,
                    b.name as brand_name,
                    c.name as category_name,
                    COUNT(pv.id) as variant_count,
                    SUM(pv.stock_quantity) as total_stock
                  FROM " . $this->table_name . " p
                  LEFT JOIN brands b ON p.brand_id = b.id
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN product_variants pv ON p.id = pv.product_id
                  GROUP BY p.id
                  ORDER BY p.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get single product with variants
    public function readOne() {
        $query = "SELECT 
                    p.id, p.name, p.description, p.price, p.cost_price, p.image_url,
                    b.name as brand_name,
                    c.name as category_name
                  FROM " . $this->table_name . " p
                  LEFT JOIN brands b ON p.brand_id = b.id
                  LEFT JOIN categories c ON p.category_id = c.id
                  WHERE p.id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            $this->name = $row['name'];
            $this->description = $row['description'];
            $this->price = $row['price'];
            $this->cost_price = $row['cost_price'];
            $this->image_url = $row['image_url'];
            
            // Get variants
            $variant_query = "SELECT id, size, color, stock_quantity, sku 
                             FROM product_variants 
                             WHERE product_id = ?";
            $variant_stmt = $this->conn->prepare($variant_query);
            $variant_stmt->bindParam(1, $this->id);
            $variant_stmt->execute();
            
            $variants = array();
            while($variant_row = $variant_stmt->fetch(PDO::FETCH_ASSOC)) {
                $variants[] = $variant_row;
            }
            
            return array(
                'id' => $row['id'],
                'name' => $row['name'],
                'brand_name' => $row['brand_name'],
                'category_name' => $row['category_name'],
                'description' => $row['description'],
                'price' => $row['price'],
                'cost_price' => $row['cost_price'],
                'image_url' => $row['image_url'],
                'variants' => $variants
            );
        }
        
        return false;
    }

    // Create product
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET name=:name, brand_id=:brand_id, category_id=:category_id, 
                      description=:description, price=:price, cost_price=:cost_price, 
                      image_url=:image_url";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":brand_id", $this->brand_id);
        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":cost_price", $this->cost_price);
        $stmt->bindParam(":image_url", $this->image_url);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Update product
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET name=:name, brand_id=:brand_id, category_id=:category_id,
                      description=:description, price=:price, cost_price=:cost_price,
                      image_url=:image_url
                  WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":brand_id", $this->brand_id);
        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":cost_price", $this->cost_price);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Delete product
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    // Search products
    public function search($keywords) {
        $query = "SELECT 
                    p.id, p.name, p.description, p.price, p.cost_price, p.image_url,
                    b.name as brand_name,
                    c.name as category_name,
                    COUNT(pv.id) as variant_count,
                    SUM(pv.stock_quantity) as total_stock
                  FROM " . $this->table_name . " p
                  LEFT JOIN brands b ON p.brand_id = b.id
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN product_variants pv ON p.id = pv.product_id
                  WHERE p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?
                  GROUP BY p.id
                  ORDER BY p.name";

        $keywords = "%{$keywords}%";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->bindParam(3, $keywords);
        $stmt->execute();

        return $stmt;
    }
}
?>
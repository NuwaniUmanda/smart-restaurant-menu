<?php
class Sale {
    private $conn;
    private $table_name = "sales";

    public $id;
    public $sale_number;
    public $user_id;
    public $customer_name;
    public $customer_phone;
    public $customer_email;
    public $subtotal;
    public $tax_amount;
    public $discount_amount;
    public $total_amount;
    public $payment_method;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create sale
    public function create() {
        try {
            $this->conn->beginTransaction();

            // Generate sale number
            $this->sale_number = 'SALE-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $query = "INSERT INTO " . $this->table_name . "
                      SET sale_number=:sale_number, user_id=:user_id, 
                          customer_name=:customer_name, customer_phone=:customer_phone,
                          customer_email=:customer_email, subtotal=:subtotal,
                          tax_amount=:tax_amount, discount_amount=:discount_amount,
                          total_amount=:total_amount, payment_method=:payment_method,
                          status=:status";

            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":sale_number", $this->sale_number);
            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":customer_name", $this->customer_name);
            $stmt->bindParam(":customer_phone", $this->customer_phone);
            $stmt->bindParam(":customer_email", $this->customer_email);
            $stmt->bindParam(":subtotal", $this->subtotal);
            $stmt->bindParam(":tax_amount", $this->tax_amount);
            $stmt->bindParam(":discount_amount", $this->discount_amount);
            $stmt->bindParam(":total_amount", $this->total_amount);
            $stmt->bindParam(":payment_method", $this->payment_method);
            $stmt->bindParam(":status", $this->status);

            if($stmt->execute()) {
                $sale_id = $this->conn->lastInsertId();
                $this->conn->commit();
                return $sale_id;
            }

            $this->conn->rollback();
            return false;

        } catch(Exception $e) {
            $this->conn->rollback();
            return false;
        }
    }

    // Add sale item
    public function addItem($sale_id, $product_variant_id, $quantity, $unit_price) {
        try {
            // Add sale item
            $query = "INSERT INTO sale_items 
                      SET sale_id=:sale_id, product_variant_id=:product_variant_id,
                          quantity=:quantity, unit_price=:unit_price, 
                          total_price=:total_price";

            $total_price = $quantity * $unit_price;
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":sale_id", $sale_id);
            $stmt->bindParam(":product_variant_id", $product_variant_id);
            $stmt->bindParam(":quantity", $quantity);
            $stmt->bindParam(":unit_price", $unit_price);
            $stmt->bindParam(":total_price", $total_price);

            if($stmt->execute()) {
                // Update stock
                $update_stock = "UPDATE product_variants 
                                SET stock_quantity = stock_quantity - :quantity 
                                WHERE id = :variant_id";
                $stock_stmt = $this->conn->prepare($update_stock);
                $stock_stmt->bindParam(":quantity", $quantity);
                $stock_stmt->bindParam(":variant_id", $product_variant_id);
                $stock_stmt->execute();

                // Record inventory movement
                $movement_query = "INSERT INTO inventory_movements 
                                  SET product_variant_id=:variant_id, movement_type='out',
                                      quantity=:quantity, reason='Sale', user_id=:user_id";
                $movement_stmt = $this->conn->prepare($movement_query);
                $movement_stmt->bindParam(":variant_id", $product_variant_id);
                $movement_stmt->bindParam(":quantity", $quantity);
                $movement_stmt->bindParam(":user_id", $this->user_id);
                $movement_stmt->execute();

                return true;
            }

            return false;

        } catch(Exception $e) {
            return false;
        }
    }

    // Get all sales
    public function read() {
        $query = "SELECT 
                    s.id, s.sale_number, s.customer_name, s.customer_phone,
                    s.total_amount, s.payment_method, s.status, s.created_at,
                    u.username as cashier_name
                  FROM " . $this->table_name . " s
                  LEFT JOIN users u ON s.user_id = u.id
                  ORDER BY s.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get single sale with items
    public function readOne() {
        $query = "SELECT 
                    s.*, u.username as cashier_name
                  FROM " . $this->table_name . " s
                  LEFT JOIN users u ON s.user_id = u.id
                  WHERE s.id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row) {
            // Get sale items
            $items_query = "SELECT 
                              si.quantity, si.unit_price, si.total_price,
                              p.name as product_name,
                              pv.size, pv.color, pv.sku
                            FROM sale_items si
                            JOIN product_variants pv ON si.product_variant_id = pv.id
                            JOIN products p ON pv.product_id = p.id
                            WHERE si.sale_id = ?";
            
            $items_stmt = $this->conn->prepare($items_query);
            $items_stmt->bindParam(1, $this->id);
            $items_stmt->execute();
            
            $items = array();
            while($item_row = $items_stmt->fetch(PDO::FETCH_ASSOC)) {
                $items[] = $item_row;
            }
            
            $row['items'] = $items;
            return $row;
        }
        
        return false;
    }

    // Get sales report
    public function getSalesReport($start_date = null, $end_date = null) {
        $where_clause = "";
        if($start_date && $end_date) {
            $where_clause = "WHERE DATE(s.created_at) BETWEEN '$start_date' AND '$end_date'";
        }

        $query = "SELECT 
                    DATE(s.created_at) as sale_date,
                    COUNT(s.id) as total_sales,
                    SUM(s.total_amount) as total_revenue,
                    AVG(s.total_amount) as average_sale
                  FROM " . $this->table_name . " s
                  $where_clause
                  GROUP BY DATE(s.created_at)
                  ORDER BY sale_date DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
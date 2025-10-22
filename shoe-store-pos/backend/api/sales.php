<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../models/Sale.php';

$database = new Database();
$db = $database->getConnection();
$sale = new Sale($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get single sale
            $sale->id = $_GET['id'];
            $result = $sale->readOne();
            
            if($result) {
                http_response_code(200);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Sale not found."));
            }
        } elseif(isset($_GET['report'])) {
            // Get sales report
            $start_date = $_GET['start_date'] ?? null;
            $end_date = $_GET['end_date'] ?? null;
            
            $stmt = $sale->getSalesReport($start_date, $end_date);
            $report = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $report[] = $row;
            }
            
            http_response_code(200);
            echo json_encode($report);
        } else {
            // Get all sales
            $stmt = $sale->read();
            $sales = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $sales[] = $row;
            }
            
            http_response_code(200);
            echo json_encode($sales);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->items) && !empty($data->total_amount)) {
            try {
                $db->beginTransaction();
                
                $sale->user_id = $data->user_id ?? 1;
                $sale->customer_name = $data->customer_name ?? '';
                $sale->customer_phone = $data->customer_phone ?? '';
                $sale->customer_email = $data->customer_email ?? '';
                $sale->subtotal = $data->subtotal;
                $sale->tax_amount = $data->tax_amount ?? 0;
                $sale->discount_amount = $data->discount_amount ?? 0;
                $sale->total_amount = $data->total_amount;
                $sale->payment_method = $data->payment_method;
                $sale->status = 'completed';
                
                $sale_id = $sale->create();
                
                if($sale_id) {
                    // Add sale items
                    foreach($data->items as $item) {
                        $success = $sale->addItem(
                            $sale_id,
                            $item->product_variant_id,
                            $item->quantity,
                            $item->unit_price
                        );
                        
                        if(!$success) {
                            throw new Exception("Failed to add sale item");
                        }
                    }
                    
                    $db->commit();
                    
                    http_response_code(201);
                    echo json_encode(array(
                        "message" => "Sale created successfully.",
                        "sale_id" => $sale_id,
                        "sale_number" => $sale->sale_number
                    ));
                } else {
                    throw new Exception("Failed to create sale");
                }
                
            } catch(Exception $e) {
                $db->rollback();
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create sale: " . $e->getMessage()));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to create sale. Data is incomplete."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
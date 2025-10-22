<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../models/Product.php';

$database = new Database();
$db = $database->getConnection();
$product = new Product($db);

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get single product
            $product->id = $_GET['id'];
            $result = $product->readOne();
            
            if($result) {
                http_response_code(200);
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Product not found."));
            }
        } elseif(isset($_GET['search'])) {
            // Search products
            $stmt = $product->search($_GET['search']);
            $products = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $products[] = $row;
            }
            
            http_response_code(200);
            echo json_encode($products);
        } else {
            // Get all products
            $stmt = $product->read();
            $products = array();
            
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $products[] = $row;
            }
            
            http_response_code(200);
            echo json_encode($products);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->name) && !empty($data->price)) {
            $product->name = $data->name;
            $product->brand_id = $data->brand_id ?? null;
            $product->category_id = $data->category_id ?? null;
            $product->description = $data->description ?? '';
            $product->price = $data->price;
            $product->cost_price = $data->cost_price ?? 0;
            $product->image_url = $data->image_url ?? '';
            
            $product_id = $product->create();
            
            if($product_id) {
                http_response_code(201);
                echo json_encode(array("message" => "Product created.", "id" => $product_id));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create product."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to create product. Data is incomplete."));
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id) && !empty($data->name) && !empty($data->price)) {
            $product->id = $data->id;
            $product->name = $data->name;
            $product->brand_id = $data->brand_id ?? null;
            $product->category_id = $data->category_id ?? null;
            $product->description = $data->description ?? '';
            $product->price = $data->price;
            $product->cost_price = $data->cost_price ?? 0;
            $product->image_url = $data->image_url ?? '';
            
            if($product->update()) {
                http_response_code(200);
                echo json_encode(array("message" => "Product updated."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to update product."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to update product. Data is incomplete."));
        }
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id)) {
            $product->id = $data->id;
            
            if($product->delete()) {
                http_response_code(200);
                echo json_encode(array("message" => "Product deleted."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to delete product."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to delete product. Data is incomplete."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
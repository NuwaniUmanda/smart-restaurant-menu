<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $query = "SELECT id, name, description FROM categories ORDER BY name";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $categories = array();
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $categories[] = $row;
        }
        
        http_response_code(200);
        echo json_encode($categories);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->name)) {
            $query = "INSERT INTO categories SET name=:name, description=:description";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":description", $data->description);
            
            if($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Category created.", "id" => $db->lastInsertId()));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create category."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to create category. Data is incomplete."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
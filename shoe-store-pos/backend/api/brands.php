<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $query = "SELECT id, name, description FROM brands ORDER BY name";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $brands = array();
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $brands[] = $row;
        }
        
        http_response_code(200);
        echo json_encode($brands);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->name)) {
            $query = "INSERT INTO brands SET name=:name, description=:description";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(":name", $data->name);
            $stmt->bindParam(":description", $data->description);
            
            if($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Brand created.", "id" => $db->lastInsertId()));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create brand."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Unable to create brand. Data is incomplete."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?>
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

// 🛒 Temporary cart storage per Dialogflow session
const sessions = {};

// -----------------------------
// Health check endpoint - THIS MUST WORK
// -----------------------------
app.get("/", (req, res) => {
  res.send("🍕 Food ordering webhook is running!");
});

app.get("/webhook", (req, res) => {
  res.send("✅ Webhook endpoint is ready. Use POST requests from Dialogflow.");
});

// -----------------------------
// Webhook endpoint
// -----------------------------
app.post("/webhook", (req, res) => {
  console.log("📥 Received webhook request");
  
  const intent = req.body.queryResult.intent.displayName;
  const sessionId = req.body.session;
  const parameters = req.body.queryResult.parameters;

  console.log("Intent:", intent);

  // Ensure a cart exists for this user session
  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  // -----------------------------
  // AddToCart Intent
  // -----------------------------
  if (intent === "AddToCart") {
    // 🔍 DEBUG: See what Dialogflow is actually sending
    console.log("=== DEBUG AddToCart ===");
    console.log("All parameters:", JSON.stringify(parameters, null, 2));
    console.log("======================");

    // Extract food_item (comes as an array from Dialogflow)
    let item = parameters.food_item || parameters.food || "item";
    
    // If it's an array, get the first element
    if (Array.isArray(item)) {
      console.log("food_item is array:", item);
      item = item[0] || "item";
    }

    // Extract quantity
    const quantity = parameters.quantity || parameters.number || 1;

    console.log("Extracted - Item:", item, "Quantity:", quantity);

    // Add to the user's cart
    sessions[sessionId].push({ item, quantity });

    const responseText = `Added ${quantity} ${item}(s) to your cart.`;
    
    console.log(`✅ Response: ${responseText}`);
    
    return res.json({
      fulfillmentText: responseText,
    });
  }

  // -----------------------------
  // ViewCart Intent
  // -----------------------------
  if (intent === "ViewCart") {
    const cart = sessions[sessionId];

    if (!cart || cart.length === 0) {
      return res.json({
        fulfillmentText: "Your cart is empty.",
      });
    }

    const cartItems = cart.map(i => `${i.quantity} x ${i.item}`).join(", ");
    const responseText = `Your cart contains: ${cartItems}.`;

    return res.json({
      fulfillmentText: responseText,
    });
  }

  // -----------------------------
  // ClearCart Intent
  // -----------------------------
  if (intent === "ClearCart") {
    sessions[sessionId] = [];
    return res.json({
      fulfillmentText: "Your cart has been cleared.",
    });
  }

  // -----------------------------
  // Default Fallback
  // -----------------------------
  console.log("⚠️ Unknown intent or no handler");
  return res.json({
    fulfillmentText: "I'm not sure what to do with that request.",
  });
});

// -----------------------------
// Start the webhook server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔍 Test at: http://localhost:${PORT}`);
});
import React, { useState } from "react";
import WelcomePage from "./components/WelcomePage";
import MenuPage from "./components/MenuPage";
import CartPage from "./components/CartPage";

function App() {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [cart, setCart] = useState([]);

  // Sample menu data (should match MenuPage for now)
  const sampleMenu = [
    {
      id: 1,
      name: "Spicy Ramen",
      price: 12.99,
      image: "🍜",
      description: "Hot and flavorful ramen with chili oil.",
      tags: ["spicy", "popular"],
    },
    {
      id: 2,
      name: "Veggie Delight",
      price: 9.99,
      image: "🥗",
      description: "Fresh salad with seasonal vegetables.",
      tags: ["vegetarian", "healthy"],
    },
    {
      id: 3,
      name: "Classic Burger",
      price: 10.99,
      image: "🍔",
      description: "Juicy beef burger with cheese and lettuce.",
      tags: ["popular"],
    },
    {
      id: 4,
      name: "Margherita Pizza",
      price: 14.99,
      image: "🍕",
      description: "Fresh tomatoes, mozzarella cheese, and basil on crispy crust.",
      tags: ["vegetarian", "popular"],
    },
    {
      id: 5,
      name: "Grilled Salmon",
      price: 18.99,
      image: "🐟",
      description: "Fresh Atlantic salmon with lemon herbs and vegetables.",
      tags: ["healthy", "seafood"],
    },
    {
      id: 6,
      name: "Caesar Salad",
      price: 8.99,
      image: "🥬",
      description: "Crisp romaine lettuce with parmesan and croutons.",
      tags: ["vegetarian", "healthy"],
    },
  ];

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQuantity = (id, change) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmOrder = () => {
    alert("Order confirmed! (Firebase integration coming soon)");
    setCart([]);
    setCurrentPage("welcome");
  };

  return (
    <div className="font-sans min-h-screen">
      {currentPage === "welcome" && (
        <WelcomePage onViewMenu={() => setCurrentPage("menu")} />
      )}
      {currentPage === "menu" && (
        <MenuPage
          onBack={() => setCurrentPage("welcome")}
          onCart={() => setCurrentPage("cart")}
          onAddToCart={addToCart}
        />
      )}
      {currentPage === "cart" && (
        <CartPage
          cart={cart}
          onBack={() => setCurrentPage("menu")}
          onUpdateQty={updateQuantity}
          onRemove={removeFromCart}
          onConfirmOrder={handleConfirmOrder}
        />
      )}
    </div>
  );
}

export default App;

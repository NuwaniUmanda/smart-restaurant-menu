import React, { useState } from "react";

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
];

const MenuPage = ({ onBack, onCart, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter menu items based on search term
  const filteredMenu = sampleMenu.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="flex items-center justify-between px-4 py-4 bg-white shadow sticky top-0 z-10">
        <button onClick={onBack} className="text-orange-600 font-bold">Back</button>
        <h2 className="text-2xl font-bold text-orange-600">Menu</h2>
        <button onClick={onCart} className="relative">
          <span className="text-2xl">🛒</span>
        </button>
      </header>
      
      {/* Search Bar */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-gray-400 hover:text-gray-600 text-xl">✕</span>
            </button>
          )}
        </div>
      </div>

      <main className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.length > 0 ? (
          filteredMenu.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4 text-center">{item.image}</div>
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-3">{item.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-orange-600">${item.price}</span>
                <button 
                  onClick={() => onAddToCart(item)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
            <p className="text-gray-500">Try searching for something else</p>
          </div>
        )}
      </main>
      <button className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-all">
        Place Order
      </button>
    </div>
  );
};

export default MenuPage; 
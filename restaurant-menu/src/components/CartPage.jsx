import React from "react";

const CartPage = ({ cart, onBack, onUpdateQty, onRemove, onConfirmOrder }) => {
  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="flex items-center justify-between px-4 py-4 bg-white shadow sticky top-0 z-10">
        <button onClick={onBack} className="text-orange-600 font-bold">Back</button>
        <h2 className="text-2xl font-bold text-orange-600">Your Cart</h2>
        <div></div>
      </header>
      <main className="p-4">
        {cart.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">Your cart is empty.</div>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{item.image}</span>
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-gray-500">${item.price}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onUpdateQty(item.id, -1)} className="bg-gray-200 px-2 rounded">-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} className="bg-gray-200 px-2 rounded">+</button>
                </div>
                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 w-full bg-white shadow p-4 flex flex-col items-center">
        <div className="text-xl font-bold mb-2">Total: ${getTotal().toFixed(2)}</div>
        <button
          onClick={onConfirmOrder}
          className="bg-orange-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-all"
          disabled={cart.length === 0}
        >
          Confirm Order
        </button>
      </footer>
    </div>
  );
};

export default CartPage; 
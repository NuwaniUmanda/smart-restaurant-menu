import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Settings, Shield, Menu, Plus, Minus, Filter } from 'lucide-react';
import { useMenu } from '../MenuContext';
import { useCart } from '../CartContext';

const MenuPage = ({ onCart, onAdmin }) => {
  const { menu } = useMenu();
  const { addToCart, getCartItemCount, loadCart, loading: cartLoading, error: cartError } = useCart();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState({});
  const [sizeQuantities, setSizeQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminButton, setShowAdminButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowAdminButton(false);
      } else {
        setShowAdminButton(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const categories = [
    "All", "Main Course", "Indian Food", "Fast Food", "Seafood", 
    "Appetizers", "Salads", "Soup", "Beverages", "Desserts"
  ];

  const categoryOrder = [
    "Main Course", "Indian Food", "Fast Food", "Seafood", 
    "Appetizers", "Salads", "Soup", "Beverages", "Desserts"
  ];

  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === "All" || 
      item.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(item.category?.toLowerCase() || '');
    
    if (!search) return matchesCategory;

    const searchLower = search.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(searchLower);
    const matchesDescription = item.description && item.description.toLowerCase().includes(searchLower);
    const matchesTags = item.tags && Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(searchLower));
    
    let matchesPrice = false;
    if (item.hasSizes && item.sizeOptions) {
      matchesPrice = item.sizeOptions.some(size => size.price.toString().includes(search));
    } else if (item.price) {
      matchesPrice = item.price.toString().includes(search);
    }
    
    const matchesSearch = matchesName || matchesDescription || matchesTags || matchesPrice;
    return matchesCategory && matchesSearch;
  });

  const groupedMenu = {};
  categoryOrder.forEach(category => {
    groupedMenu[category] = filteredMenu.filter(item => 
      item.category?.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(item.category?.toLowerCase() || '')
    );
  });

  const handleQuantityChange = (id, delta) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const newQty = Math.max(1, current + delta);
      
      const item = menu.find(item => item.id === id);
      if (item && item.availableAmount !== undefined && newQty > item.availableAmount) {
        return prev;
      }
      
      return { ...prev, [id]: newQty };
    });
  };

  const handleSizeQuantityChange = (itemId, sizeCode, delta) => {
    const key = `${itemId}_${sizeCode}`;
    setSizeQuantities(prev => {
      const current = prev[key] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [key]: newQty };
    });
  };

  const handleSizeSelection = (itemId, sizeCode) => {
    setSelectedSizes(prev => {
      const currentSelections = prev[itemId] || [];
      const isSelected = currentSelections.includes(sizeCode);
      
      if (isSelected) {
        return {
          ...prev,
          [itemId]: currentSelections.filter(code => code !== sizeCode)
        };
      } else {
        return {
          ...prev,
          [itemId]: [...currentSelections, sizeCode]
        };
      }
    });
  };

  const isSizeSelected = (itemId, sizeCode) => {
    const selectedSizesForItem = selectedSizes[itemId] || [];
    return selectedSizesForItem.includes(sizeCode);
  };

  const getSizeQuantity = (itemId, sizeCode) => {
    const key = `${itemId}_${sizeCode}`;
    return sizeQuantities[key] || 1;
  };

  const handleAddToCart = async (item, qty = null, selectedSize = null) => {
    try {
      if (item.hasSizes && item.sizeOptions) {
        const itemSelectedSizes = selectedSizes[item.id] || [];
        if (itemSelectedSizes.length === 0) {
          alert('Please select at least one size before adding to cart');
          return;
        }
        
        const promises = [];
        for (const sizeCode of itemSelectedSizes) {
          const sizeOption = item.sizeOptions.find(size => size.code === sizeCode);
          if (!sizeOption) continue;
          
          const quantity = getSizeQuantity(item.id, sizeCode);
          
          const cartItem = {
            ...item,
            price: sizeOption.price,
            selectedSize: sizeOption,
            displayName: `${item.name} (${sizeOption.name})`
          };
          
          promises.push(addToCart(cartItem, quantity));
        }

        await Promise.all(promises);
        await loadCart();
        
        const itemSelectedSizes2 = selectedSizes[item.id] || [];
        itemSelectedSizes2.forEach(sizeCode => {
          const key = `${item.id}_${sizeCode}`;
          setSizeQuantities(prev => ({ ...prev, [key]: 1 }));
        });
        
        setSelectedSizes(prev => ({
          ...prev,
          [item.id]: []
        }));
        
      } else {
        const quantity = qty || quantities[item.id] || 1;
        
        setAddingToCart(item.id);
        
        const cartItem = {
          ...item,
          selectedSize: null,
          displayName: item.name
        };
        
        await addToCart(cartItem, quantity);
        
        setQuantities(prev => ({ ...prev, [item.id]: 1 }));
      }
      
      const button = document.querySelector(`[data-item-id="${item.id}"]`);
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="flex items-center gap-1 sm:gap-2"><svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Added!</span>';
        button.style.background = '#10B981';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(null);
    }
  };

  const getDisplayPrice = (item) => {
    if (item.hasSizes && item.sizeOptions && item.sizeOptions.length > 0) {
      const prices = item.sizeOptions.map(size => size.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice ? `LKR ${minPrice.toFixed(2)}` : `LKR ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
    }
    return `LKR ${(item.price || 0).toFixed(2)}`;
  };

  const renderMenuItem = (item) => (
    <div
      key={item.id}
      className="bg-gradient-to-r from-gray-900 via-black to-gray-800 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-red-600 hover:border-red-400 transition-all duration-300 overflow-hidden group hover:shadow-red-600/20"
    >
      <div className="flex flex-row">
        {item.image && (
          <div className="w-32 h-32 sm:w-36 md:w-40 lg:w-48 sm:h-auto flex-shrink-0 relative overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {item.availableAmount !== undefined && (
              <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
                  item.availableAmount === 0 
                    ? 'bg-red-600 text-white' 
                    : item.availableAmount < 5
                    ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
                }`}>
                  {item.availableAmount === 0 ? 'Out of Stock' : `${item.availableAmount}`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 p-2.5 sm:p-4">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-sm sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-red-400 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  {!item.image && item.availableAmount !== undefined && (
                    <div className="mt-2">
                      <span className={`px-2 py-1 sm:px-3 text-xs font-semibold rounded-full ${
                        item.availableAmount === 0 
                          ? 'bg-red-600 text-white' 
                          : item.availableAmount < 5
                          ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}>
                        {item.availableAmount === 0 ? 'Out of Stock' : `${item.availableAmount}`}
                      </span>
                    </div>
                  )}
                </div>
                {!item.hasSizes && (
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-xl md:text-2xl font-bold text-red-400">
                      {getDisplayPrice(item)}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-300 mb-2 leading-relaxed text-[11px] sm:text-xs md:text-sm line-clamp-2 sm:line-clamp-none">
                {item.description || 'Delicious and expertly crafted dish prepared with the finest ingredients.'}
              </p>

              {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="hidden sm:flex flex-wrap gap-1 sm:gap-2 mb-3">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {item.hasSizes && item.sizeOptions && item.sizeOptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Available Sizes:</h4>
                  <div className="space-y-3">
                    {item.sizeOptions.map((size, index) => (
                      <div
                        key={index}
                        className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSizeSelected(item.id, size.code)
                            ? 'border-red-500 bg-red-600 bg-opacity-20'
                            : 'border-gray-700 bg-gray-800 hover:border-red-600 hover:bg-red-600 hover:bg-opacity-10'
                        }`}
                        onClick={() => handleSizeSelection(item.id, size.code)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-white text-sm flex items-center gap-2">
                                  {size.name}
                                  {isSizeSelected(item.id, size.code) && (
                                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </h5>
                                {size.description && (
                                  <p className="text-xs text-gray-300 mt-1">{size.description}</p>
                                )}
                              </div>
                              <div className="text-lg font-bold text-red-400">
                                LKR {size.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {isSizeSelected(item.id, size.code) && (
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSizeQuantityChange(item.id, size.code, -1);
                                }}
                                disabled={getSizeQuantity(item.id, size.code) <= 1}
                                className="w-8 h-8 flex items-center justify-center bg-gray-700 border border-red-600 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-sm shadow-lg">
                                {getSizeQuantity(item.id, size.code)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSizeQuantityChange(item.id, size.code, 1);
                                }}
                                disabled={item.availableAmount !== undefined && getSizeQuantity(item.id, size.code) >= item.availableAmount}
                                className="w-8 h-8 flex items-center justify-center bg-gray-700 border border-red-600 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!item.hasSizes && (
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={(quantities[item.id] || 1) <= 1}
                    className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800 border border-red-600 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 h-8 sm:w-12 sm:h-10 flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg">
                    {quantities[item.id] || 1}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    disabled={item.availableAmount !== undefined && (quantities[item.id] || 1) >= item.availableAmount}
                    className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-800 border border-red-600 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.availableAmount === 0 || addingToCart === item.id || cartLoading}
                  data-item-id={item.id}
                  className="flex-1 sm:flex-none px-2 py-2 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <ShoppingCart size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
                  <span className="whitespace-nowrap">
                    {addingToCart === item.id ? 'Adding...' : 
                     item.availableAmount === 0 ? 'Out of Stock' : 
                     'Add to Cart'}
                  </span>
                </button>
              </div>
            )}

            {item.hasSizes && item.sizeOptions && item.sizeOptions.length > 0 && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.availableAmount === 0 || addingToCart === item.id || cartLoading}
                  data-item-id={item.id}
                  className="px-4 py-3 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <ShoppingCart size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
                  <span className="whitespace-nowrap">
                    {addingToCart === item.id ? 'Adding...' : 
                     item.availableAmount === 0 ? 'Out of Stock' : 
                       ((selectedSizes[item.id] && selectedSizes[item.id].length > 0) ? 
                         'Add to Cart' : 
                         'Select Size(s) First')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(135deg, #111827 0%, #000000 100%)'
    }}>

      <div className={`fixed top-2 left-2 sm:top-6 sm:right-6 sm:left-auto z-[60] transition-all duration-300 ${
        showAdminButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={onAdmin}
          className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all border border-gray-600 hover:border-red-500 shadow-lg backdrop-blur-sm"
        >
          <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-xs sm:text-sm font-medium">Admin</span>
        </button>
      </div>

      <div className="fixed inset-0 z-0">
        {[...Array(window.innerWidth < 768 ? 10 : 20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-red-600 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
        
        <div className="absolute -top-10 -left-10 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-red-600 to-red-800 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-l from-red-700 to-red-900 rounded-full blur-3xl opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-20 left-1/3 w-36 h-36 sm:w-72 sm:h-72 bg-gradient-to-t from-red-600 to-red-700 rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dc2626" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 text-white text-center py-12 sm:py-16 lg:py-20 backdrop-blur-sm">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://static.vecteezy.com/system/resources/thumbnails/037/201/061/small/ai-generated-generative-ai-busy-chefs-working-on-the-restaurant-kitchen-blurred-background-photo.jpg)'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-red-500 via-red-700 to-red-800 bg-clip-text text-transparent">
            Smart Restaurant
          </h1>
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-gray-100 px-4">
            Experience the future of dining with our intelligent ordering system
          </p>

          <div className="flex justify-center items-center gap-2 sm:gap-4 text-red-400">
            <div className="w-8 h-0.5 sm:w-12 bg-gradient-to-r from-transparent to-red-600"></div>
            <span className="text-2xl sm:text-3xl lg:text-4xl">🍽️</span>
            <div className="w-8 h-0.5 sm:w-12 bg-gradient-to-l from-transparent to-red-600"></div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 backdrop-blur-md bg-black bg-opacity-95 border-b border-red-600 shadow-xl pt-14 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-white">Our Menu</h2>
              <span className="text-xs sm:text-sm text-gray-400">({filteredMenu.length})</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden flex items-center gap-1 px-2 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
              >
                <Menu size={18} />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 lg:px-4 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
              >
                <Filter size={16} className="lg:w-[18px] lg:h-[18px]" />
                <span className="text-sm lg:text-base">Filters</span>
              </button>
              
              <button
                onClick={onCart}
                className="flex items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 lg:px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg relative"
              >
                <ShoppingCart size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
                <span className="text-xs sm:text-sm lg:text-base">Cart</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 border-t border-gray-700 pt-4 animate-slideDown">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all border border-gray-700 mb-3"
              >
                <Filter size={18} />
                Filters
              </button>
            </div>
          )}

          <div className="pb-3 sm:pb-4">
            <div className="relative max-w-xs sm:max-w-md mx-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 text-white rounded-lg sm:rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 placeholder-gray-400 text-sm sm:text-base"
              />
            </div>
          </div>

          {showFilters && (
            <div className="pb-2 animate-slideDown">
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 justify-center">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 rounded text-[10px] sm:text-xs ${
                      selectedCategory === category
                        ? "bg-red-600 text-white border border-red-600"
                        : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {cartError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900 bg-opacity-50 border border-red-600 rounded-xl text-red-200 text-sm sm:text-base">
            <strong>Cart Error:</strong> {cartError}
          </div>
        )}

        {filteredMenu.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-white text-xl sm:text-2xl mb-4">
              {menu.length === 0 ? "No menu items available" : "No menu items found"}
            </div>
            <div className="text-gray-400 text-sm sm:text-base px-4">
              {menu.length === 0 
                ? "Menu items will appear here when added by admin"
                : search || selectedCategory !== "All" 
                ? "Try adjusting your search or filter criteria" 
                : "Check back later for new items"
              }
            </div>
          </div>
        ) : selectedCategory === "All" ? (
          <div className="space-y-8">
            {categoryOrder.map(category => {
              const categoryItems = groupedMenu[category];
              if (!categoryItems || categoryItems.length === 0) return null;
              
              return (
                <div key={category}>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 pb-2 border-b-2 border-red-600">
                    {category}
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    {categoryItems.map(item => renderMenuItem(item))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredMenu.map(item => renderMenuItem(item))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(90deg); }
          50% { transform: translateY(0px) rotate(180deg); }
          75% { transform: translateY(10px) rotate(270deg); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #dc2626, #991b1b);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #991b1b, #7f1d1d);
        }

        @media (max-width: 640px) {
          .min-h-screen {
            min-height: 100vh;
            min-height: -webkit-fill-available;
          }
          
          body {
            overflow-x: hidden;
          }
          
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }

        @media screen and (-webkit-min-device-pixel-ratio:0) {
          input[type="text"],
          input[type="search"],
          input[type="number"],
          textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuPage;
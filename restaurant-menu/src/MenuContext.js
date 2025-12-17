import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './services/firebase';
import { PREDEFINED_SIZE_OPTIONS, validateSizeOptions } from './services/menuService';
import config from './config';

const MenuContext = createContext();

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const baseUrl = config.API_BASE_URL; 

        // Public endpoint - no auth needed for fetching menu
        const response = await fetch(`${baseUrl}/api/menu-items`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        
        const data = await response.json();
        
        // Ensure proper structure for menu items
        const formattedMenu = data.map(item => ({
          ...item,
          hasSizes: item.hasSizes || false,
          sizeOptions: item.sizeOptions || [],
          basePrice: item.basePrice || item.price || 0,
          available: item.available !== undefined ? item.available : true
        }));
        
        setMenu(formattedMenu);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setError(error.message);
        setMenu([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenu();
  }, []);

  // Add menu item (admin only - requires auth)
  const addMenuItem = async (newItem) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for admin operations');
      }

      const idToken = await user.getIdToken();
      const baseUrl = config.API_BASE_URL;

      // Prepare menu item with proper structure
      const menuItemData = {
        name: newItem.name,
        description: newItem.description || '',
        category: newItem.category || '',
        price: newItem.price || 0,
        basePrice: newItem.basePrice || newItem.price || 0,
        image: newItem.image || '',
        available: newItem.available !== undefined ? newItem.available : true,
        hasSizes: newItem.hasSizes || false,
        sizeOptions: newItem.sizeOptions || [],
        tags: newItem.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate size options if item has sizes
      if (menuItemData.hasSizes && menuItemData.sizeOptions.length > 0) {
        const validation = validateSizeOptions(menuItemData.sizeOptions);
        if (!validation.isValid) {
          throw new Error(`Size options validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      const response = await fetch(`${baseUrl}/api/menu-items`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify(menuItemData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add menu item');
      }
      
      const data = await response.json();
      setMenu(prevMenu => [...prevMenu, data]);
      return data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  };

  // Update menu item (admin only - requires auth)
  const updateMenuItem = async (id, updatedData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for admin operations');
      }

      const idToken = await user.getIdToken();
      const baseUrl = config.API_BASE_URL;

      // Prepare updated data with proper structure
      const menuItemData = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // Validate size options if item has sizes
      if (menuItemData.hasSizes && menuItemData.sizeOptions && menuItemData.sizeOptions.length > 0) {
        const validation = validateSizeOptions(menuItemData.sizeOptions);
        if (!validation.isValid) {
          throw new Error(`Size options validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      const response = await fetch(`${baseUrl}/api/menu-items/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify(menuItemData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update menu item');
      }
      
      const data = await response.json();
      setMenu(prevMenu => 
        prevMenu.map(item => item.id === id ? { ...item, ...data } : item)
      );
      return data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  };

  // Delete menu item (admin only - requires auth)
  const deleteMenuItem = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for admin operations');
      }

      const idToken = await user.getIdToken();
      const baseUrl = config.API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/menu-items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete menu item');
      }
      
      setMenu(prevMenu => prevMenu.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  };

  // Helper function to get menu item by ID
  const getMenuItemById = (id) => {
    return menu.find(item => item.id === id);
  };

  // Helper function to get menu items by category
  const getMenuItemsByCategory = (category) => {
    return menu.filter(item => 
      item.category.toLowerCase() === category.toLowerCase() && item.available
    );
  };

  // Helper function to get available sizes for a menu item
  const getAvailableSizes = (menuItemId) => {
    const item = getMenuItemById(menuItemId);
    if (!item || !item.hasSizes) {
      return [];
    }
    
    return item.sizeOptions
      .filter(size => size.available)
      .map(size => ({
        name: size.name,
        code: size.code,
        price: size.price,
        available: size.available
      }));
  };

  // Helper function to get menu item with selected size
  const getMenuItemWithSize = (menuItemId, sizeCode) => {
    const item = getMenuItemById(menuItemId);
    if (!item) {
      throw new Error('Menu item not found');
    }

    if (!item.hasSizes) {
      return {
        ...item,
        selectedSize: null,
        finalPrice: item.price
      };
    }
    
    const selectedSize = item.sizeOptions.find(size => size.code === sizeCode);
    
    if (!selectedSize) {
      throw new Error(`Size "${sizeCode}" not available for this item`);
    }
    
    return {
      ...item,
      selectedSize: {
        name: selectedSize.name,
        code: selectedSize.code,
        price: selectedSize.price
      },
      finalPrice: selectedSize.price
    };
  };

  // Helper function to create size options structure for new items
  const createSizeOptionsStructure = (enabledSizes = {}) => {
    return PREDEFINED_SIZE_OPTIONS
      .filter(size => enabledSizes[size.code.toLowerCase()])
      .map(size => ({
        name: size.name,
        code: size.code,
        price: 0, // To be set by admin
        available: true
      }));
  };

  // Helper function to validate menu item before saving
  const validateMenuItem = (menuItem) => {
    const errors = [];
    
    if (!menuItem.name || menuItem.name.trim() === '') {
      errors.push('Menu item name is required');
    }
    
    if (!menuItem.price || menuItem.price <= 0) {
      errors.push('Valid price is required');
    }
    
    if (!menuItem.category || menuItem.category.trim() === '') {
      errors.push('Category is required');
    }
    
    // Validate size options if item has sizes
    if (menuItem.hasSizes) {
      if (!menuItem.sizeOptions || menuItem.sizeOptions.length === 0) {
        errors.push('At least one size option is required when "Has Sizes" is enabled');
      } else {
        const sizeValidation = validateSizeOptions(menuItem.sizeOptions);
        if (!sizeValidation.isValid) {
          errors.push(...sizeValidation.errors);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return (
    <MenuContext.Provider value={{ 
      menu, 
      loading, 
      error, 
      addMenuItem, 
      updateMenuItem, 
      deleteMenuItem,
      getMenuItemById,
      getMenuItemsByCategory,
      getAvailableSizes,
      getMenuItemWithSize,
      createSizeOptionsStructure,
      validateMenuItem,
      PREDEFINED_SIZE_OPTIONS
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
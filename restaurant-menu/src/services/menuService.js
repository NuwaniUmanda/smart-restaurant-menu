import { auth } from "./firebase";
import { handleError, retryWithBackoff } from "../utils/errorHandler";
import config from '../config';

// API base URL
const API_BASE_URL = config.API_BASE_URL;

// Predefined size options with structure for admin to set prices
export const PREDEFINED_SIZE_OPTIONS = [
  { name: 'Small', code: 'S' },
  { name: 'Medium', code: 'M' },
  { name: 'Large', code: 'L' }
];

// Helper function to create size options structure for menu items
export const createSizeOptionsStructure = (hasSmall = false, hasMedium = false, hasLarge = false) => {
  const sizeOptions = [];
  
  if (hasSmall) {
    sizeOptions.push({
      name: 'Small',
      code: 'S',
      price: 0, // To be set by admin
      available: true
    });
  }
  
  if (hasMedium) {
    sizeOptions.push({
      name: 'Medium',
      code: 'M',
      price: 0, // To be set by admin
      available: true
    });
  }
  
  if (hasLarge) {
    sizeOptions.push({
      name: 'Large',
      code: 'L',
      price: 0, // To be set by admin
      available: true
    });
  }
  
  return sizeOptions;
};

// Helper function to validate size options
export const validateSizeOptions = (sizeOptions) => {
  const errors = [];
  
  if (!Array.isArray(sizeOptions)) {
    errors.push('Size options must be an array');
    return { isValid: false, errors };
  }
  
  sizeOptions.forEach((size, index) => {
    if (!size.name) {
      errors.push(`Size option ${index + 1}: Name is required`);
    }
    
    if (!size.code) {
      errors.push(`Size option ${index + 1}: Code is required`);
    }
    
    if (size.price === undefined || size.price === null || size.price < 0) {
      errors.push(`Size option ${index + 1}: Valid price is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fetch all menu items (public, no auth required)
export const fetchMenuItems = async () => {
  try {
    const querySnapshot = await retryWithBackoff(async () => {
      return await getDocs(collection(db, "restaurantMenu"));
    });
    
    const items = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure size options have proper structure
        sizeOptions: data.sizeOptions || [],
        hasSizes: data.hasSizes || false,
        basePrice: data.basePrice || data.price || 0
      };
    });
    return items;
  } catch (error) {
    throw new Error(handleError(error, "fetchMenuItems"));
  }
};

// Add a new menu item (admin only, requires token)
export const addMenuItem = async (item) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const idToken = await user.getIdToken(); // Get the Firebase ID token

    // Validate the menu item structure
    const menuItemData = {
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price || 0,
      basePrice: item.basePrice || item.price || 0,
      image: item.image || '',
      available: item.available !== undefined ? item.available : true,
      hasSizes: item.hasSizes || false,
      sizeOptions: item.sizeOptions || [],
      tags: item.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate size options if item has sizes
    if (menuItemData.hasSizes) {
      const validation = validateSizeOptions(menuItemData.sizeOptions);
      if (!validation.isValid) {
        throw new Error(`Size options validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const response = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/menu-items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(menuItemData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return res;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to add menu item";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(handleError(error, "addMenuItem"));
  }
};

// Update a menu item (admin only, requires token)
export const updateMenuItem = async (id, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const idToken = await user.getIdToken();

    // Prepare updated data with proper structure
    const menuItemData = {
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    // Validate size options if item has sizes
    if (menuItemData.hasSizes && menuItemData.sizeOptions) {
      const validation = validateSizeOptions(menuItemData.sizeOptions);
      if (!validation.isValid) {
        throw new Error(`Size options validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const response = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/menu-items/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(menuItemData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return res;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to update menu item";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(handleError(error, "updateMenuItem"));
  }
};

// Delete a menu item (admin only, requires token)
export const deleteMenuItem = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const idToken = await user.getIdToken();
    const response = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/menu-items/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return res;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to delete menu item";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return { message: "Menu item deleted successfully" };
  } catch (error) {
    throw new Error(handleError(error, "deleteMenuItem"));
  }
};

// Helper function to get available sizes for a menu item
export const getAvailableSizes = (menuItem) => {
  if (!menuItem.hasSizes || !menuItem.sizeOptions) {
    return [];
  }
  
  return menuItem.sizeOptions
    .filter(size => size.available)
    .map(size => ({
      name: size.name,
      code: size.code,
      price: size.price,
      available: size.available
    }));
};

// Helper function to get menu item with selected size
export const getMenuItemWithSize = (menuItem, sizeCode) => {
  if (!menuItem.hasSizes) {
    return {
      ...menuItem,
      selectedSize: null,
      finalPrice: menuItem.price
    };
  }
  
  const selectedSize = menuItem.sizeOptions.find(size => size.code === sizeCode);
  
  if (!selectedSize) {
    throw new Error(`Size "${sizeCode}" not available for this item`);
  }
  
  return {
    ...menuItem,
    selectedSize: {
      name: selectedSize.name,
      code: selectedSize.code,
      price: selectedSize.price
    },
    finalPrice: selectedSize.price
  };
};

// Helper function to format menu item for display
export const formatMenuItemForDisplay = (menuItem, selectedSizeCode = null) => {
  if (!menuItem.hasSizes) {
    return {
      ...menuItem,
      displayName: menuItem.name,
      displayPrice: `LKR ${menuItem.price.toFixed(2)}`,
      selectedSize: null
    };
  }
  
  if (selectedSizeCode) {
    const selectedSize = menuItem.sizeOptions.find(size => size.code === selectedSizeCode);
    if (selectedSize) {
      return {
        ...menuItem,
        displayName: `${menuItem.name} (${selectedSize.name})`,
        displayPrice: `LKR ${selectedSize.price.toFixed(2)}`,
        selectedSize: {
          name: selectedSize.name,
          code: selectedSize.code,
          price: selectedSize.price
        }
      };
    }
  }
  
  // Show price range for items with sizes
  const prices = menuItem.sizeOptions
    .filter(size => size.available)
    .map(size => size.price);
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return {
    ...menuItem,
    displayName: menuItem.name,
    displayPrice: minPrice === maxPrice 
      ? `LKR ${minPrice.toFixed(2)}`
      : `LKR ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`,
    selectedSize: null
  };
};
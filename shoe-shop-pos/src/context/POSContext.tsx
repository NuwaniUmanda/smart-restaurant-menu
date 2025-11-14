import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Cart, CartItem, Customer, Shoe, UIState } from '../types';

interface POSState {
  ui: UIState;
  currentEmployee: { id: string; name: string; role: string } | null;
}

type POSAction =
  | { type: 'SET_VIEW'; payload: UIState['currentView'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_SELECTED_CUSTOMER'; payload: Customer | undefined }
  | { type: 'ADD_TO_CART'; payload: { shoe: Shoe; size: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string } // item id
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART_DISCOUNT'; payload: number }
  | { type: 'LOGIN_EMPLOYEE'; payload: { id: string; name: string; role: string } }
  | { type: 'LOGOUT_EMPLOYEE' };

const initialState: POSState = {
  ui: {
    currentView: 'pos',
    isLoading: false,
    error: undefined,
    selectedCustomer: undefined,
    cart: {
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    },
  },
  currentEmployee: {
    id: '1',
    name: 'Admin User',
    role: 'admin',
  },
};

function calculateCartTotals(items: CartItem[], discount: number = 0): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax - discount;

  return {
    items,
    subtotal,
    tax,
    discount,
    total,
  };
}

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        ui: { ...state.ui, currentView: action.payload },
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      };

    case 'SET_SELECTED_CUSTOMER':
      return {
        ...state,
        ui: { ...state.ui, selectedCustomer: action.payload },
      };

    case 'ADD_TO_CART': {
      const { shoe, size, quantity } = action.payload;
      const existingItemIndex = state.ui.cart.items.findIndex(
        item => item.shoe.id === shoe.id && item.size === size
      );

      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...state.ui.cart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
          total: (newItems[existingItemIndex].quantity + quantity) * newItems[existingItemIndex].unitPrice,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          shoe,
          size,
          quantity,
          unitPrice: shoe.basePrice,
          total: quantity * shoe.basePrice,
        };
        newItems = [...state.ui.cart.items, newItem];
      }

      const newCart = calculateCartTotals(newItems, state.ui.cart.discount);
      return {
        ...state,
        ui: { ...state.ui, cart: newCart },
      };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.ui.cart.items.filter((_, index) => index.toString() !== action.payload);
      const newCart = calculateCartTotals(newItems, state.ui.cart.discount);
      return {
        ...state,
        ui: { ...state.ui, cart: newCart },
      };
    }

    case 'UPDATE_CART_ITEM': {
      const { id, quantity } = action.payload;
      const newItems = state.ui.cart.items.map((item, index) => {
        if (index.toString() === id) {
          return {
            ...item,
            quantity,
            total: quantity * item.unitPrice,
          };
        }
        return item;
      });
      const newCart = calculateCartTotals(newItems, state.ui.cart.discount);
      return {
        ...state,
        ui: { ...state.ui, cart: newCart },
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        ui: {
          ...state.ui,
          cart: {
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
          },
        },
      };

    case 'SET_CART_DISCOUNT': {
      const newCart = calculateCartTotals(state.ui.cart.items, action.payload);
      return {
        ...state,
        ui: { ...state.ui, cart: newCart },
      };
    }

    case 'LOGIN_EMPLOYEE':
      return {
        ...state,
        currentEmployee: action.payload,
      };

    case 'LOGOUT_EMPLOYEE':
      return {
        ...state,
        currentEmployee: null,
      };

    default:
      return state;
  }
}

const POSContext = createContext<{
  state: POSState;
  dispatch: React.Dispatch<POSAction>;
} | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);

  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
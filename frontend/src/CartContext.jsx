// Import React and some hooks we need
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Create a new Context for the cart
// Context lets us share data (like cart items) across components without passing props manually
const CartContext = createContext();

// This is the Provider component
// It wraps your app and makes the cart data and functions available to any child component
export const CartProvider = ({ children }) => {
  const { token } = useAuth();

  // Storage key depends on whether a user is logged in
  const storageKey = token ? `cart_${token}` : "cart_guest";

  // State to store all items in the cart
  // Each item is an object: { productId, name, qty, price }
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist cart whenever items or auth token changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items, storageKey]);

  // When authentication changes, migrate guest cart to user cart or clear on logout
  useEffect(() => {
    const guestKey = "cart_guest";
    const userKey = token ? `cart_${token}` : null;

    if (token) {
      // on login: prefer existing user cart, else migrate guest cart
      try {
        const userRaw = localStorage.getItem(userKey);
        if (userRaw) {
          setItems(JSON.parse(userRaw));
        } else {
          const guestRaw = localStorage.getItem(guestKey);
          if (guestRaw) {
            localStorage.setItem(userKey, guestRaw);
            localStorage.removeItem(guestKey);
            setItems(JSON.parse(guestRaw));
          }
        }
      } catch (e) {
        // ignore
      }
    } else {
      // on logout: clear cart from memory and remove any user-scoped cart data
      setItems([]);
    }
  }, [token]);

  // Function to add an item to the cart
  // product: the item object you want to add (must include productId, name, price)
  // qty: quantity to add (defaults to 1 if not provided)
  const addItem = (product, qty = 1) => {
    setItems(prev => {
      // Ensure the cart item carries a productId (used for placing orders)
      const normalized = { ...product, productId: product.productId || product.id, name: product.name || product.title };
      // Check if the product already exists in the cart
      const existing = prev.find(i => i.productId === normalized.productId);

      if (existing) {
        // If it exists, increase the quantity
        return prev.map(i =>
          i.productId === normalized.productId ? { ...i, qty: i.qty + qty } : i
        );
      }

      // If it doesn't exist, add it as a new item
      return [...prev, { ...normalized, qty }];
    });
  };

  // Function to remove an item from the cart by its productId
  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId));

  // Function to update the quantity of a specific item (by productId)
  const updateQty = (productId, qty) =>
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));

  // Function to clear the entire cart
  const clearCart = () => setItems([]);

  // Calculate the total number of items in the cart
  // reduce() loops through all items and adds up the quantities
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  // Provide the cart data and functions to any component that needs it
  return (
    <CartContext.Provider
      value={{
        items,       // current cart items
        addItem,     // function to add items
        removeItem,  // function to remove items
        updateQty,   // function to change quantity
        clearCart,   // function to empty the cart
        totalCount   // total items in the cart
      }}
    >
      {children} {/* Render the child components inside the provider */}
    </CartContext.Provider>
  );
};

// Custom hook for consuming the cart context more easily
// Instead of writing useContext(CartContext) everywhere, we can just call useCart()
export const useCart = () => useContext(CartContext);

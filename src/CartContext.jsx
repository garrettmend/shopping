// Import React and some hooks we need
import React, { createContext, useContext, useState } from "react";

// Create a new Context for the cart
// Context lets us share data (like cart items) across components without passing props manually
const CartContext = createContext();

// This is the Provider component
// It wraps your app and makes the cart data and functions available to any child component
export const CartProvider = ({ children }) => {
  // State to store all items in the cart
  // Each item is an object: { id, title, qty, price }
  const [items, setItems] = useState([]);

  // Function to add an item to the cart
  // product: the item object you want to add
  // qty: quantity to add (defaults to 1 if not provided)
  const addItem = (product, qty = 1) => {
    // Update the cart state
    setItems(prev => {
      // Check if the product already exists in the cart
      const existing = prev.find(i => i.id === product.id);

      if (existing) {
        // If it exists, increase the quantity
        return prev.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }

      // If it doesn't exist, add it as a new item
      return [...prev, { ...product, qty }];
    });
  };

  // Function to remove an item from the cart by its id
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  // Function to update the quantity of a specific item
  const updateQty = (id, qty) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));

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

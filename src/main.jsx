import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { CartProvider } from "./CartContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </React.StrictMode>
);

// What CartProvider is doing
// <CartProvider>
//   <RouterProvider router={router} />
// </CartProvider>


// CartProvider is a React Context provider.

// It wraps your entire app (or at least the parts that need access to the cart) so any component inside your app can access the cart state (items, quantities, add/remove functions) without passing props manually.

// Essentially, it’s a global state container for your shopping cart.

// Why it’s wrapped around RouterProvider

// The router renders all your pages (Shop, Cart) inside App.jsx via <Outlet />.

// By wrapping RouterProvider in CartProvider, every page/component rendered by the router can access the cart context.

// Without this, components like your Cart page or Shop product cards wouldn’t know the state of the cart.
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);


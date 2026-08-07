import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

/**
 * Route layout:
 *  /           -> Shop (index)
 *  /cart       -> Cart
 *  /product/:id-> Product detail (dynamic)
 *  /login      -> Login
 *  /register   -> Register
 *  /checkout   -> Checkout (requires auth)
 *
 * App renders the NavBar + <Outlet />
 */

const routes = [
  {
    path: "/",
    element: <App />, //parent of children routes
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Shop /> },
      { path: "cart", element: <Cart /> },
      { path: "product/:id", element: <Product /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "checkout", element: <Checkout /> },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;

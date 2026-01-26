import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import NotFound from "./pages/NotFound";

/**
 * Route layout:
 *  /           -> Shop (index)
 *  /cart       -> Cart
 *  /product/:id-> Product detail (dynamic)
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
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;

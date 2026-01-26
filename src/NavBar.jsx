import React from "react";
import { NavLink } from "react-router-dom";
import { useCart } from "./CartContext";

const NavBar = () => {
  const { totalCount } = useCart();

  const activeStyle = { fontWeight: "700", textDecoration: "underline" };

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd", display: "flex", gap: "1rem" }}>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeStyle : undefined)}>Shop</NavLink>
      <NavLink to="/cart" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Cart{totalCount > 0 ? ` (${totalCount})` : ""}
      </NavLink>
    </nav>
  );
};

export default NavBar;

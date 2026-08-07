import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

const NavBar = () => {
  const { totalCount, clearCart } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const activeStyle = { fontWeight: "700", textDecoration: "underline" };

  const handleLogout = () => {
    // clear cart immediately for UI
    clearCart();
    logout();
    navigate("/");
  };

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd", display: "flex", gap: "1rem", alignItems: "center" }}>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeStyle : undefined)}>Shop</NavLink>
      <NavLink to="/cart" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Cart{totalCount > 0 ? ` (${totalCount})` : ""}
      </NavLink>
      {isAuthenticated ? (
        <button onClick={handleLogout} style={{ marginLeft: "auto" }}>Logout</button>
      ) : (
        <div style={{ display: "flex", gap: "1rem", marginLeft: "auto" }}>
          <NavLink to="/login" style={({ isActive }) => (isActive ? activeStyle : undefined)}>Login</NavLink>
          <NavLink to="/register" style={({ isActive }) => (isActive ? activeStyle : undefined)}>Register</NavLink>
        </div>
      )}
    </nav>
  );
};

export default NavBar;

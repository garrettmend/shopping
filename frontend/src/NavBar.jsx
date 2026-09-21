import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";

const NavBar = () => {
  const { totalCount, clearCart } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `navbar-link${isActive ? " navbar-link--active" : ""}`;

  const handleLogout = () => {
    // clear cart immediately for UI
    clearCart();
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">Shopping Cart</NavLink>
      <NavLink to="/" className={linkClass} end>Shop</NavLink>
      <NavLink to="/cart" className={linkClass}>
        Cart{totalCount > 0 ? ` (${totalCount})` : ""}
      </NavLink>
      {isAuthenticated ? (
        <button onClick={handleLogout} className="btn btn-secondary btn-sm navbar-spacer">Logout</button>
      ) : (
        <div className="navbar-spacer">
          <NavLink to="/login" className={linkClass}>Login</NavLink>
          <NavLink to="/register" className={linkClass}>Register</NavLink>
        </div>
      )}
    </nav>
  );
};

export default NavBar;

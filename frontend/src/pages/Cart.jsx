import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext";

const Cart = () => {
  const { items, updateQty, removeItem, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="empty-state">
      <h1>Your cart is empty</h1>
      <Link to="/">Go to shop</Link>
    </div>
  );

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

  return (
    <>
      <h1>Your Cart</h1>
      <ul className="cart-list">
        {items.map(i => (
          <li key={i.productId} className="card cart-line">
            <span>
              <strong>{i.name}</strong> — ${Number(i.price).toFixed(2)} × {i.qty} = ${(Number(i.price) * i.qty).toFixed(2)}
            </span>
            <div className="cart-line-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => updateQty(i.productId, Math.max(1, i.qty - 1))}>-</button>
              <button className="btn btn-secondary btn-sm" onClick={() => updateQty(i.productId, i.qty + 1)}>+</button>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(i.productId)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="cart-total">Total: ${total.toFixed(2)}</h2>
      <div className="cart-footer-actions">
        <button className="btn btn-secondary" onClick={clearCart}>Clear cart</button>
        <Link to="/checkout">
          <button className="btn btn-primary">Proceed to Checkout</button>
        </Link>
      </div>
    </>
  );
};

export default Cart;

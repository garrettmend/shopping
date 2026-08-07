import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext";

const Cart = () => {
  const { items, updateQty, removeItem, clearCart } = useCart();

  if (items.length === 0) return (
    <>
      <h1>Your cart is empty</h1>
      <Link to="/">Go to shop</Link>
    </>
  );

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

  return (
    <>
      <h1>Your Cart</h1>
      <ul>
        {items.map(i => (
          <li key={i.productId} style={{ marginBottom: 12 }}>
            <strong>{i.name}</strong> — ${Number(i.price).toFixed(2)} × {i.qty} = ${(Number(i.price) * i.qty).toFixed(2)}
            <div>
              <button onClick={() => updateQty(i.productId, Math.max(1, i.qty - 1))}>-</button>
              <button onClick={() => updateQty(i.productId, i.qty + 1)}>+</button>
              <button onClick={() => removeItem(i.productId)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <h2>Total: ${total.toFixed(2)}</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={clearCart}>Clear cart</button>
        <Link to="/checkout">
          <button>Proceed to Checkout</button>
        </Link>
      </div>
    </>
  );
};

export default Cart;

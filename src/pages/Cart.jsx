import React from "react";
import { useCart } from "../CartContext";

const Cart = () => {
  const { items, updateQty, removeItem, clearCart } = useCart();

  if (items.length === 0) return (
    <>
      <h1>Your cart is empty</h1>
    </>
  );

  return (
    <>
      <h1>Your Cart</h1>
      <ul>
        {items.map(i => (
          <li key={i.id} style={{ marginBottom: 12 }}>
            <strong>{i.title}</strong> — ${i.price} × {i.qty}
            <div>
              <button onClick={() => updateQty(i.id, Math.max(1, i.qty - 1))}>-</button>
              <button onClick={() => updateQty(i.id, i.qty + 1)}>+</button>
              <button onClick={() => removeItem(i.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={clearCart}>Clear cart</button>
    </>
  );
};

export default Cart;


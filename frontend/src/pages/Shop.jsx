import React, { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { Link } from "react-router-dom";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  return (
    <>
      <h1>Shop</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {products.map(p => (
          <article key={p.id} style={{ border: "1px solid #eee", padding: 12 }}>
            <h3>{p.name}</h3>
            {p.image && <img src={p.image} alt={p.name} style={{ width: "100px", height: "100px", objectFit: "contain" }} />}
            <p>${Number(p.price).toFixed(2)}</p>
            <p>In stock: {p.stock}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => addItem({ productId: p.id, name: p.name, price: Number(p.price) }, 1)}>
                Add to cart
              </button>
              <Link to={`/product/${p.id}`}>View</Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default Shop;


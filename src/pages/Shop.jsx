import React, { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { Link } from "react-router-dom";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
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
            <h3>{p.title}</h3>
            <img src={p.image} alt={p.title} style={{ width: "100px", height: "100px", objectFit: "contain" }} />
            <p>${p.price}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => addItem({ id: p.id, title: p.title, price: p.price }, 1)}>
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

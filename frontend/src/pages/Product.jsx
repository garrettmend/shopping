import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../CartContext";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(setProduct)
      .catch(console.error);
  }, [id]);

  if (!product) return <p className="status-text">Loading...</p>;

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h1>{product.name}</h1>
      {product.image && <img src={product.image} alt={product.name} style={{ width: 200 }} />}
      <p className="product-price">${Number(product.price).toFixed(2)}</p>
      <p className="product-stock">In stock: {product.stock}</p>
      <button
        className="btn btn-primary"
        onClick={() => addItem({ productId: product.id, name: product.name, price: Number(product.price) }, 1)}
      >
        Add to cart
      </button>
    </div>
  );
};

export default Product;

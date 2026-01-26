import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../CartContext";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`https://fakestoreapi.com/products/${id}`)
      .then(res => res.json())
      .then(setProduct)
      .catch(console.error);
  }, [id]);

  if (!product) return <p>Loading...</p>;

  return (
    <>
      <h1>{product.title}</h1>
      <img src={product.image} alt={product.title} style={{ width: 200 }} />
      <p>{product.description}</p>
      <p>${product.price}</p>
      <button onClick={() => addItem({ id: product.id, title: product.title, price: product.price }, 1)}>
        Add to cart
      </button>
    </>
  );
};

export default Product;

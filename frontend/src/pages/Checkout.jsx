import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useCart } from "../CartContext";
import { useAuth } from "../AuthContext";

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [successPaid, setSuccessPaid] = useState(false);

  // Detect successful redirect back from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccessPaid(true);
      setOrderStatus("PENDING");
      clearCart();
    } else if (searchParams.get("canceled") === "true") {
      setError("Payment was cancelled. You can try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Require login before checkout
  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [token, navigate]);

  // Listen for Kafka notification events via Socket.io
  // (order-status-update events are broadcast by the notification-service)
  useEffect(() => {
    const socket = io();
    socket.on("order-status-update", (data) => {
      setOrderStatus(data.status);
      if (data.status === "CONFIRMED" || data.status === "CANCELLED") {
        setOrderId(data.orderId);
      }
    });
    return () => socket.disconnect();
  }, []);

  const totalPrice = items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

  // Create a Stripe Checkout Session and redirect to Stripe's hosted checkout
  const payWithStripe = async () => {
    setError("");
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: Number(i.price),
          quantity: i.qty,
        })),
      };
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start payment");
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (!token) {
    return (
      <p>
        Redirecting to login... <Link to="/login">Login</Link>
      </p>
    );
  }

  if (items.length === 0 && !orderStatus && !successPaid) {
    return (
      <>
        <h1>Checkout</h1>
        <p>Your cart is empty. <Link to="/">Go to shop</Link></p>
      </>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1>Checkout</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {(orderStatus || successPaid) && (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <p>
            <strong>Order {orderId ? `#${orderId.slice(0, 8)}` : "status"}:</strong> {orderStatus || "PENDING"}
          </p>
          {successPaid && <p>Payment successful! Waiting for inventory confirmation...</p>}
          {orderStatus === "PENDING" && <p>Waiting for inventory confirmation...</p>}
          <Link to="/">Continue shopping</Link>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((i) => (
          <li key={i.productId} style={{ marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
            <strong>{i.name}</strong> — ${Number(i.price).toFixed(2)} × {i.qty} = $
            {(Number(i.price) * i.qty).toFixed(2)}
          </li>
        ))}
      </ul>

      <h2>Total: ${totalPrice.toFixed(2)}</h2>
      <button onClick={payWithStripe} disabled={placing || items.length === 0}>
        {placing ? "Redirecting to Stripe..." : "Pay with Stripe"}
      </button>
    </div>
  );
};

export default Checkout;

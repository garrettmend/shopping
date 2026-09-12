import React, { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loadTestCount, setLoadTestCount] = useState(10);
  const [loadTestStatus, setLoadTestStatus] = useState("");
  const [orderLoadStatus, setOrderLoadStatus] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { addItem } = useCart();
  const { token } = useAuth();

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }

    fetch("/api/auth/admin-status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, [token]);

  const createStripeTestSessions = async () => {
    const product = products[0];
    const count = Math.min(100, Math.max(1, Number(loadTestCount) || 1));

    if (!product || !token) {
      setLoadTestStatus("Log in and wait for products to load first.");
      return;
    }

    if (!window.confirm(`Create ${count} Stripe test Checkout Sessions?`)) return;

    setLoadTestStatus(`Creating ${count} test sessions...`);
    const createSession = async () => {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{
            productId: product.id,
            name: product.name,
            price: 1,
            quantity: 1,
          }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Stripe session failed");
      return data.sessionId;
    };

    const results = await Promise.allSettled(
      Array.from({ length: count }, createSession),
    );
    const successful = results.filter((result) => result.status === "fulfilled").length;
    setLoadTestStatus(`Created ${successful}/${count} Stripe test sessions at $1.00 each.`);
  };

  const runOrderLoadTest = async () => {
    const product = products[0];
    if (!product || !token) {
      setOrderLoadStatus("Log in and wait for products to load first.");
      return;
    }

    if (!window.confirm("Run 100 concurrent order workers for 30 seconds? This creates real test orders.")) return;

    const endTime = Date.now() + 30_000;
    const stats = { requests: 0, successful: 0, expectedFailures: 0, unexpectedFailures: 0, latency: 0 };
    setOrderLoadStatus("Running 100 concurrent order workers for 30 seconds...");

    const worker = async () => {
      while (Date.now() < endTime) {
        const startedAt = performance.now();
        try {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }),
          });
          stats.requests += 1;
          stats.latency += performance.now() - startedAt;
          if (response.status === 201) stats.successful += 1;
          else if (response.status === 400) stats.expectedFailures += 1;
          else stats.unexpectedFailures += 1;
        } catch {
          stats.requests += 1;
          stats.unexpectedFailures += 1;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    await Promise.all(Array.from({ length: 100 }, worker));
    const averageLatency = stats.requests ? Math.round(stats.latency / stats.requests) : 0;
    setOrderLoadStatus(
      `Finished: ${stats.requests} requests, ${stats.successful} orders, ` +
      `${stats.expectedFailures} expected stock failures, ${stats.unexpectedFailures} unexpected failures, ` +
      `${averageLatency}ms average latency.`,
    );
  };

  return (
    <>
      <h1>Shop</h1>
      {isAdmin && (
        <section>
          <label>
            Stripe test sessions
            <input
              type="number"
              min="1"
              max="100"
              value={loadTestCount}
              onChange={(event) => setLoadTestCount(event.target.value)}
            />
          </label>
          <button onClick={createStripeTestSessions}>Create test sessions</button>
          {loadTestStatus && <p>{loadTestStatus}</p>}
        </section>
      )}
      {isAdmin && (
        <section>
          <button onClick={runOrderLoadTest}>Run 100-User Order Test</button>
          {orderLoadStatus && <p>{orderLoadStatus}</p>}
        </section>
      )}
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


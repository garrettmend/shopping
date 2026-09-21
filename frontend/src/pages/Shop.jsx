import React, { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loadTestCount, setLoadTestCount] = useState(10);
  const [loadTestStatus, setLoadTestStatus] = useState("");
  const [orderLoadStatus, setOrderLoadStatus] = useState("");
  const [orderLoadLogs, setOrderLoadLogs] = useState([]);
  const [cacheTestStatus, setCacheTestStatus] = useState("");
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
    const count = Math.min(100, Math.max(1, Number(loadTestCount) || 1));

    if (products.length === 0 || !token) {
      setLoadTestStatus("Log in and wait for products to load first.");
      return;
    }

    if (!window.confirm(`Create ${count} Stripe test Checkout Sessions?`)) return;

    setLoadTestStatus(`Creating ${count} test sessions...`);
    const createSession = async () => {
      const product = products[Math.floor(Math.random() * products.length)];
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
    if (products.length === 0 || !token) {
      setOrderLoadStatus("Log in and wait for products to load first.");
      return;
    }

    if (!window.confirm("Run 100 concurrent order workers for 30 seconds? This creates real test orders.")) return;

    const endTime = Date.now() + 30_000;
    const stats = { requests: 0, successful: 0, expectedFailures: 0, unexpectedFailures: 0, latency: 0 };
    const log = (message) => {
      const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
      console.log(`[Order Load Test] ${message}`);
      setOrderLoadLogs((current) => [...current, entry].slice(-100));
    };

    setOrderLoadLogs([]);
    setOrderLoadStatus("Running 100 concurrent order workers for 30 seconds...");
    log("Started 100 workers for 30 seconds.");

    const worker = async () => {
      while (Date.now() < endTime) {
        const product = products[Math.floor(Math.random() * products.length)];
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
          if (stats.requests % 100 === 0) {
            log(`Progress: ${stats.requests} requests, ${stats.successful} successful, ${stats.expectedFailures} expected failures, ${stats.unexpectedFailures} unexpected failures.`);
          }
        } catch {
          stats.requests += 1;
          stats.unexpectedFailures += 1;
          log(`Request ${stats.requests} failed with a network error.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    await Promise.all(Array.from({ length: 100 }, worker));
    const averageLatency = stats.requests ? Math.round(stats.latency / stats.requests) : 0;
    setOrderLoadStatus(
      `Finished: ${stats.requests} requests, ${stats.successful} orders, ` +
      `${stats.expectedFailures} expected stock failures, ${stats.unexpectedFailures} unexpected failures, ` +
      `${averageLatency}ms average latency. Restoring stock...`,
    );
    log(`Finished: ${stats.requests} requests, ${stats.successful} successful, ${stats.expectedFailures} expected failures, ${stats.unexpectedFailures} unexpected failures, ${averageLatency}ms average latency.`);

    // Reset every product back to its full test stock so repeated runs behave consistently
    try {
      const restoreResponse = await fetch("/api/products/stock/restore", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (restoreResponse.ok) {
        const restoreData = await restoreResponse.json();
        log(`Restored stock to ${restoreData.stock} for ${restoreData.restored} products.`);
        setOrderLoadStatus((current) => `${current.replace(" Restoring stock...", "")} Stock restored to ${restoreData.stock}.`);
        fetch("/api/products").then((res) => res.json()).then(setProducts).catch(() => {});
      } else {
        log("Stock restore failed: admin permission required.");
        setOrderLoadStatus((current) => `${current.replace(" Restoring stock...", "")} Stock restore failed (admin required).`);
      }
    } catch {
      log("Stock restore failed: network error.");
    }
  };

  const runCacheTest = async () => {
    if (!token) return;
    setCacheTestStatus("Running cold and warm cache requests...");
    const headers = { Authorization: `Bearer ${token}` };
    await fetch("/api/products/cache/reset", { method: "POST", headers });

    const coldStart = performance.now();
    const coldResponse = await fetch("/api/products");
    await coldResponse.json();
    const coldMs = Math.round(performance.now() - coldStart);

    const warmStart = performance.now();
    const warmResponse = await fetch("/api/products");
    await warmResponse.json();
    const warmMs = Math.round(performance.now() - warmStart);

    const message = `Cold: ${coldMs}ms (${coldResponse.headers.get("X-Cache") || "unknown"}), ` +
      `warm: ${warmMs}ms (${warmResponse.headers.get("X-Cache") || "unknown"}).`;
    setCacheTestStatus(message);
    console.log(`[Redis Cache Test] ${message}`);
  };

  return (
    <>
      <h1>Shop</h1>
      {(
        <section className="card admin-panel">
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
          <button className="btn btn-secondary btn-sm" onClick={createStripeTestSessions}>Create test sessions</button>
          {loadTestStatus && <p className="status-text">{loadTestStatus}</p>}
        </section>
      )}
      {(
        <section className="card admin-panel">
          <button className="btn btn-secondary btn-sm" onClick={runOrderLoadTest}>Run 100-User Order Test</button>
          {orderLoadStatus && <p className="status-text">{orderLoadStatus}</p>}
          {orderLoadLogs.length > 0 && (
            <pre className="admin-log">
              {orderLoadLogs.join("\n")}
            </pre>
          )}
        </section>
      )}
      {(
        <section className="card admin-panel">
          <button className="btn btn-secondary btn-sm" onClick={runCacheTest}>Test Redis Cache Savings</button>
          {cacheTestStatus && <p className="status-text">{cacheTestStatus}</p>}
        </section>
      )}
      <div className="product-grid">
        {products.map(p => (
          <article key={p.id} className="card product-card">
            <h3>{p.name}</h3>
            {p.image && <img src={p.image} alt={p.name} />}
            <p className="product-price">${Number(p.price).toFixed(2)}</p>
            <p className="product-stock">In stock: {p.stock}</p>
            <div className="product-actions">
              <button className="btn btn-primary btn-sm" onClick={() => addItem({ productId: p.id, name: p.name, price: Number(p.price) }, 1)}>
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


import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import "../styles/Cart.css";

const COUPON_DISCOUNTS = {
  "C01": { type: "pct",      value: 5,   label: "5% Off Next Order" },
  "C02": { type: "pct",      value: 10,  label: "10% Off Next Order" },
  "C03": { type: "flat",     value: 150, label: "₹150 Flat Off" },
  "C04": { type: "flat",     value: 300, label: "₹300 Flat Off" },
  "C05": { type: "delivery", value: 0,   label: "Free Delivery (3 orders)" },
  "C06": { type: "pct",      value: 15,  label: "15% Off + Free Delivery" },
};

const Cart = () => {
  const [cart, setCart]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [ordering, setOrdering]       = useState(false);
  const [ordered, setOrdered]         = useState(false);
  const [updating, setUpdating]       = useState({});
  const [toast, setToast]             = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  const fetchCart = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data);
      setTotal(res.data.reduce((s, i) => s + i.subtotal, 0));
    } catch {
      setToast({ msg: "Failed to load cart.", type: "error" });
    }
  }, [API_BASE_URL, token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleQty = async (productId, delta) => {
    setUpdating((p) => ({ ...p, [productId]: true }));
    try {
      await axios.post(`${API_BASE_URL}/cart`,
        { productId, quantity: delta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {
      setToast({ msg: "Could not update quantity.", type: "error" });
    } finally {
      setUpdating((p) => ({ ...p, [productId]: false }));
    }
  };

  const handleRemove = async (productId, currentQty) => {
    await handleQty(productId, -currentQty);
    setToast({ msg: "Item removed from cart.", type: "info" });
  };

  const handleCheckout = async () => {
    setOrdering(true);
    try {
      await axios.delete(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
      setTotal(0);
      setOrdered(true);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch {
      setToast({ msg: "Checkout failed. Please try again.", type: "error" });
    } finally {
      setOrdering(false);
    }
  };

  const handleApplyCoupon = () => {
    const parts = couponInput.trim().toUpperCase().split("-");
    if (parts.length >= 2 && parts[0] === "AMZ") {
      const key = parts[1];
      const disc = COUPON_DISCOUNTS[key];
      if (disc) {
        setAppliedCoupon({ code: couponInput.trim().toUpperCase(), ...disc });
        setToast({ msg: `Coupon applied: ${disc.label}!`, type: "success" });
        return;
      }
    }
    setToast({ msg: "Invalid or expired coupon code.", type: "error" });
  };

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const discount = appliedCoupon
    ? appliedCoupon.type === "pct"  ? Math.round(total * appliedCoupon.value / 100)
    : appliedCoupon.type === "flat" ? Math.min(appliedCoupon.value, total)
    : 0
    : 0;
  const finalTotal = Math.max(0, total - discount);

  return (
    <div className="cartContainer">
      <br />
      <Link to="/">&#10094; Back</Link>
      <h1>Shopping Cart</h1>

      {/* ── Order placed ── */}
      {ordered ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={{ color: "#16a34a", marginTop: 12 }}>Order Placed Successfully!</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>Your items are on their way. Thank you for shopping!</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/" style={{ background: "#ff9900", color: "#131921", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              Continue Shopping
            </Link>
            <Link to="/returns" style={{ background: "#f0fdf4", color: "#166534", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15, border: "1.5px solid #86efac" }}>
              ↩ Return an Item
            </Link>
            <Link to="/second-life" style={{ background: "#064e3b", color: "#6ee7b7", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              🌿 Browse Second Life
            </Link>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 20 }}>
            Tip: Don't need it anymore? List it on Second Life and earn Green Credits.
          </p>
        </div>

      /* ── Empty cart ── */
      ) : cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52 }}>🛒</div>
          <h2 style={{ color: "#374151", marginTop: 12 }}>Your cart is empty</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>Looks like you haven't added anything yet.</p>
          <Link to="/" style={{ background: "#ff9900", color: "#131921", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
            Shop Now
          </Link>

          <div style={{ marginTop: 40, background: "linear-gradient(135deg,#064e3b,#047857)", borderRadius: 14, padding: "24px 28px", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 6 }}>🌿 SHOP SUSTAINABLY</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Pre-owned items on Second Life</div>
              <div style={{ fontSize: 14, color: "#a7f3d0" }}>AI-graded quality · Up to 70% off · Earn Green Credits</div>
            </div>
            <Link to="/second-life" style={{ background: "#6ee7b7", color: "#064e3b", fontWeight: 800, fontSize: 14, padding: "11px 24px", borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap" }}>
              Browse Marketplace →
            </Link>
          </div>
        </div>

      /* ── Cart with items ── */
      ) : (
        <div>
          {cart.map((item) => (
            <div key={item.product._id} className="cartItem">
              <img src={item.product.image} alt={item.product.name} />
              <div style={{ flex: 1 }}>
                <h3>{item.product.name}</h3>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "2px 0 6px" }}>{item.product.description}</p>
                <p style={{ fontWeight: 700, color: "#131921", fontSize: 16 }}>₹{item.product.price.toLocaleString("en-IN")}</p>

                <div className="cartQtyRow">
                  <button
                    className="cartQtyBtn"
                    onClick={() => item.quantity === 1 ? handleRemove(item.product.id, 1) : handleQty(item.product.id, -1)}
                    disabled={updating[item.product.id]}
                  >−</button>
                  <span className="cartQtyNum">{updating[item.product.id] ? "…" : item.quantity}</span>
                  <button
                    className="cartQtyBtn"
                    onClick={() => handleQty(item.product.id, 1)}
                    disabled={updating[item.product.id]}
                  >+</button>
                  <button
                    className="cartRemoveBtn"
                    onClick={() => handleRemove(item.product.id, item.quantity)}
                    disabled={updating[item.product.id]}
                  >🗑 Remove</button>
                </div>

                <p style={{ fontWeight: 700, color: "#059669", marginTop: 6 }}>
                  Subtotal: ₹{item.subtotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}

          {/* Order Summary */}
          <div className="checkoutDetails">
            <h2>Order Summary</h2>

            <div className="cartSummaryRow">
              <span>Items ({itemCount})</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="cartSummaryRow">
              <span>Delivery</span>
              <span style={{ color: "#059669", fontWeight: 700 }}>FREE</span>
            </div>
            <div className="cartSummaryRow cartSummaryRow--savings">
              <span>🎉 Delivery savings</span>
              <span>−₹{Math.max(99, Math.round(total * 0.03)).toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="cartSummaryRow cartSummaryRow--savings">
                <span>🌿 Coupon ({appliedCoupon.code})</span>
                <span>−₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="cartSummaryDivider" />
            <div className="cartSummaryRow cartSummaryRow--total">
              <span>Total ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
              <span style={{ color: "#059669" }}>₹{finalTotal.toLocaleString("en-IN")}</span>
            </div>

            {/* Coupon input */}
            <div className="cartCouponRow">
              {appliedCoupon ? (
                <div className="cartCouponApplied">
                  <span>🌿 <b>{appliedCoupon.code}</b> — {appliedCoupon.label}</span>
                  <button className="cartCouponRemove" onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}>✕</button>
                </div>
              ) : (
                <>
                  <input
                    className="cartCouponInput"
                    placeholder="Have a coupon code?"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <button className="cartCouponBtn" onClick={handleApplyCoupon} disabled={!couponInput.trim()}>
                    Apply
                  </button>
                </>
              )}
            </div>

            <button className="checkoutButton" onClick={handleCheckout} disabled={ordering}>
              {ordering ? "Placing Order…" : `Checkout · ₹${finalTotal.toLocaleString("en-IN")}`}
            </button>
            <Link to="/returns" className="cartReturnLink">
              ↩ Return Items
            </Link>
          </div>
        </div>
      )}

      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Cart;

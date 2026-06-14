import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import "../styles/RedeemCredits.css";

const COUPON_ICONS = {
  C01: "🏷️", C02: "💸", C03: "🎁", C04: "🚀", C05: "🚚", C06: "⭐",
};

const RedeemCredits = () => {
  const [credits, setCredits] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [redeeming, setRedeeming] = useState({});
  const [unlocked, setUnlocked] = useState({});
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [confirmCoupon, setConfirmCoupon] = useState(null);
  const [copied, setCopied]     = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedCredits = parseInt(localStorage.getItem("greenCredits") || "0");
    setCredits(storedCredits);

    // Fetch live credits + coupon catalogue in parallel
    Promise.all([
      axios.get(`${API_BASE_URL}/api/green-credits`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/api/coupons`),
    ])
      .then(([credRes, couponRes]) => {
        setCredits(credRes.data.greenCredits || 0);
        localStorage.setItem("greenCredits", credRes.data.greenCredits || 0);
        setCoupons(couponRes.data);
      })
      .catch((err) => console.error("RedeemCredits fetch error:", err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL, token]);

  const handleRedeem = async (coupon) => {
    if (credits < coupon.cost) return;
    setConfirmCoupon(null);
    setRedeeming((p) => ({ ...p, [coupon.id]: true }));
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/green-credits/redeem`,
        { couponId: coupon.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newCredits = res.data.remaining;
      setCredits(newCredits);
      localStorage.setItem("greenCredits", newCredits);
      setUnlocked((p) => ({ ...p, [coupon.id]: { code: res.data.couponCode, name: res.data.couponName } }));
      setToast({ msg: `🎉 ${coupon.name} redeemed! Use code at checkout.`, type: "success" });
    } catch (err) {
      setToast({ msg: err.response?.data?.error || "Failed to redeem. Try again.", type: "error" });
    } finally {
      setRedeeming((p) => ({ ...p, [coupon.id]: false }));
    }
  };

  const handleCopy = (code, couponId) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied((p) => ({ ...p, [couponId]: true }));
      setToast({ msg: "Coupon code copied to clipboard!", type: "success" });
      setTimeout(() => setCopied((p) => ({ ...p, [couponId]: false })), 2500);
    });
  };

  const creditPercent = Math.min((credits / 500) * 100, 100);
  const milestoneReached = credits >= 500;
  const redeemedList = Object.entries(unlocked).map(([id, val]) => ({
    id,
    name: val.name,
    code: val.code,
    coupon: coupons.find((c) => c.id === id),
  }));

  return (
    <div className="redeemPage">
      {/* Header */}
      <div className="redeemHeader">
        <Link to="/" className="redeemBackLink">&#10094; Back to Home</Link>
        <div className="redeemHeaderRow">
          <div>
            <h1 className="redeemTitle">🌿 Redeem Green Credits</h1>
            <p className="redeemSubtitle">
              Credits earned from sustainable returns, reselling, and buying pre-owned items.
            </p>
          </div>
          <div className="redeemCreditBall">
            <span className="redeemCreditNum">{loading ? "…" : credits}</span>
            <span className="redeemCreditLabel">pts</span>
          </div>
        </div>
      </div>

      <div className="redeemBody">
        {/* Credit balance card */}
        <div className="redeemBalanceCard">
          <div className="redeemBalanceTop">
            <div className="redeemBalanceLeft">
              <div className="redeemBalanceTitle">Your Green Credits</div>
              <div className="redeemBalanceNum">{credits} <span>pts</span></div>
              <div className="redeemBalanceSub">Earn more by returning items, buying pre-owned, or listing on Second Life</div>
            </div>
            <div className="redeemEarnChips">
              <div className="redeemEarnChip">↩️ Return → <b>+20 pts</b></div>
              <div className="redeemEarnChip">🛒 Buy pre-owned → <b>+15 pts</b></div>
              <div className="redeemEarnChip">🌿 List item → <b>+25 pts</b></div>
            </div>
          </div>
          {/* Progress bar toward 500 pts */}
          <div className="redeemProgressRow">
            <span className="redeemProgressLabel">Progress to 500 pts</span>
            <span className="redeemProgressNum">{credits}/500</span>
          </div>
          <div className="redeemProgressTrack">
            <div className="redeemProgressFill" style={{ width: `${creditPercent}%` }} />
          </div>
          {milestoneReached && (
            <div style={{ marginTop: 12, background: "linear-gradient(135deg,#064e3b,#047857)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <div>
                <div style={{ fontWeight: 800, color: "#6ee7b7", fontSize: 14 }}>500 Points Milestone Unlocked!</div>
                <div style={{ fontSize: 12, color: "#a7f3d0", marginTop: 2 }}>You've reached elite status — a bonus 10% off coupon has been added to your available coupons.</div>
              </div>
            </div>
          )}
        </div>

        {/* How to earn */}
        <div className="redeemHowRow">
          <Link to="/second-life" className="redeemHowCard">
            <span className="redeemHowIcon">🛒</span>
            <div>
              <div className="redeemHowTitle">Buy Pre-owned</div>
              <div className="redeemHowDesc">+15 pts per purchase on Second Life</div>
            </div>
          </Link>
          <Link to="/returns" className="redeemHowCard">
            <span className="redeemHowIcon">↩️</span>
            <div>
              <div className="redeemHowTitle">Return Items</div>
              <div className="redeemHowDesc">+20 pts per sustainable return</div>
            </div>
          </Link>
          <Link to="/second-life/sell" className="redeemHowCard">
            <span className="redeemHowIcon">🌿</span>
            <div>
              <div className="redeemHowTitle">List & Sell</div>
              <div className="redeemHowDesc">+25 pts per listing on Second Life</div>
            </div>
          </Link>
        </div>

        {/* Coupon grid */}
        <h2 className="redeemSectionTitle">Available Coupons</h2>
        {loading ? (
          <div className="redeemLoading">Loading coupons…</div>
        ) : (
          <div className="redeemCouponGrid">
            {coupons.map((coupon) => {
              const canAfford = credits >= coupon.cost;
              const isRedeeming = redeeming[coupon.id];
              const isUnlocked = !!unlocked[coupon.id];

              return (
                <div
                  key={coupon.id}
                  className={`redeemCouponCard ${!canAfford && !isUnlocked ? "redeemCouponCard--locked" : ""} ${isUnlocked ? "redeemCouponCard--unlocked" : ""}`}
                >
                  {/* Coupon icon strip */}
                  <div className="redeemCouponIconStrip">
                    <span className="redeemCouponIcon">{COUPON_ICONS[coupon.id] || "🎫"}</span>
                    <span className="redeemCouponCost">
                      🌿 {coupon.cost} pts
                    </span>
                  </div>

                  <div className="redeemCouponName">{coupon.name}</div>
                  <div className="redeemCouponDesc">{coupon.desc}</div>

                  {isUnlocked ? (
                    <div className="redeemCouponUnlocked">
                      <div className="redeemCouponUnlockedLabel">✅ Redeemed! Your code:</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <div className="redeemCouponCode">{unlocked[coupon.id].code}</div>
                        <button
                          onClick={() => handleCopy(unlocked[coupon.id].code, coupon.id)}
                          style={{ background: copied[coupon.id] ? "#dcfce7" : "#f0f2f5", border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: copied[coupon.id] ? "#166534" : "#374151", transition: "all 0.2s" }}
                        >
                          {copied[coupon.id] ? "✓ Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="redeemCouponCodeHint">Apply at checkout</div>
                    </div>
                  ) : confirmCoupon?.id === coupon.id ? (
                    <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#854d0e", margin: "0 0 8px" }}>
                        Spend {coupon.cost} pts for {coupon.name}?
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleRedeem(coupon)} disabled={isRedeeming} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          {isRedeeming ? "…" : "Yes, Redeem"}
                        </button>
                        <button onClick={() => setConfirmCoupon(null)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "7px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!canAfford && (
                        <div className="redeemShortfall">Need {coupon.cost - credits} more pts</div>
                      )}
                      <button
                        className={`redeemCouponBtn ${!canAfford ? "redeemCouponBtn--disabled" : ""}`}
                        onClick={() => canAfford && !isRedeeming && setConfirmCoupon(coupon)}
                        disabled={!canAfford || isRedeeming}
                      >
                        {canAfford ? `Redeem for ${coupon.cost} pts` : "Not enough credits"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Redemption history */}
        {redeemedList.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="redeemSectionTitle">My Redeemed Coupons</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {redeemedList.map((r) => (
                <div key={r.id} style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                      {r.coupon ? `Cost: ${r.coupon.cost} pts` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", background: "#dcfce7", color: "#166534", fontWeight: 800, fontSize: 15, padding: "5px 14px", borderRadius: 8, letterSpacing: 1 }}>
                      {r.code}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(r.code); setToast({ msg: "Code copied!", type: "success" }); }}
                      style={{ background: "#fff", border: "1px solid #86efac", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#166534" }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default RedeemCredits;

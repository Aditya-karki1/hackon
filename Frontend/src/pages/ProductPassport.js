import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ProductPassport.css";

const GRADE_COLORS = {
  "Like New": { color: "#16a34a", bg: "rgba(22,163,74,0.18)", border: "#16a34a" },
  "Good":     { color: "#2563eb", bg: "rgba(37,99,235,0.18)", border: "#3b82f6" },
  "Fair":     { color: "#d97706", bg: "rgba(217,119,6,0.18)", border: "#f59e0b" },
  "Salvage":  { color: "#dc2626", bg: "rgba(220,38,38,0.18)", border: "#ef4444" },
};

const DISPOSITION_META = {
  RETURN:           { label: "Full Refund",      icon: "↩️", color: "#3b82f6" },
  RESELL_LOCAL:     { label: "Second Life",       icon: "🌿", color: "#16a34a" },
  RECYCLE:          { label: "Eco Recycled",      icon: "♻️", color: "#f59e0b" },
  REFURBISH:        { label: "Refurbished",       icon: "🔧", color: "#8b5cf6" },
  RETURNLESS_REFUND:{ label: "Instant Refund",   icon: "⚡", color: "#06b6d4" },
  DONATE:           { label: "Donated",           icon: "🤝", color: "#ec4899" },
};

const STAGES = [
  { key: "manufactured", icon: "🏭", label: "Manufactured" },
  { key: "purchased",    icon: "🛒", label: "Purchased"    },
  { key: "inspected",    icon: "✨", label: "AI Inspected" },
  { key: "returned",     icon: "📦", label: "Return Filed" },
  { key: "outcome",      icon: "🌱", label: "Outcome"      },
];

function GradeBadge({ grade }) {
  const cfg = GRADE_COLORS[grade] || GRADE_COLORS["Fair"];
  return (
    <span className="pp-grade-badge" style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}>
      {grade}
    </span>
  );
}

function ScoreRing({ score }) {
  const color = score >= 85 ? "#16a34a" : score >= 60 ? "#3b82f6" : score >= 35 ? "#f59e0b" : "#ef4444";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="pp-score-ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="pp-score-ring-label">
        <span className="pp-score-num" style={{ color }}>{score}</span>
        <span className="pp-score-sub">/100</span>
      </div>
    </div>
  );
}

export default function ProductPassport() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/signin"); return; }
    axios.get(`${API_BASE_URL}/api/passport/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setPassport(r.data))
      .catch(e => setError(e.response?.data?.error || "Failed to load passport"))
      .finally(() => setLoading(false));
  }, [productId, API_BASE_URL, token, navigate]);

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <div className="pp-spinner" />
          <p>Loading Product Passport…</p>
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <p>{error || "Passport not found."}</p>
          <Link to="/returns" className="pp-back-btn">← Back to Returns</Link>
        </div>
      </div>
    );
  }

  const { passportId, currentStage, product, purchaseEvent, returnEvent, aiInspection, listing, impact } = passport;
  const disMeta = DISPOSITION_META[aiInspection?.disposition] || null;

  // Which timeline stages are active
  const stagesDone = new Set(["manufactured"]);
  if (purchaseEvent) stagesDone.add("purchased");
  if (aiInspection) stagesDone.add("inspected");
  if (returnEvent)  stagesDone.add("returned");
  if (currentStage === "relisted" || currentStage === "recycled" || currentStage === "sold") stagesDone.add("outcome");

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="pp-page">

      {/* ── Back nav ── */}
      <div className="pp-topbar">
        <Link to="/returns" className="pp-back-btn">← Back to Returns</Link>
        <span className="pp-topbar-tag">Digital Product Passport</span>
      </div>

      {/* ── Passport Header Card ── */}
      <div className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-img-wrap">
            {product?.image
              ? <img src={product.image} alt={product?.name} className="pp-hero-img" />
              : <div className="pp-hero-img-placeholder">📦</div>
            }
          </div>
          <div className="pp-hero-info">
            <div className="pp-hero-brand">{product?.brand || "—"}</div>
            <h1 className="pp-hero-name">{product?.name || "Unknown Product"}</h1>
            {product?.price && (
              <div className="pp-hero-price">Original price: ₹{product.price.toLocaleString("en-IN")}</div>
            )}
            <div className="pp-verified-row">
              <span className="pp-verified-stamp">✅ VERIFIED PASSPORT</span>
              {aiInspection?.grade && <GradeBadge grade={aiInspection.grade} />}
            </div>
          </div>
          <div className="pp-passport-id-block">
            <div className="pp-qr-placeholder">
              <div className="pp-qr-grid">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="pp-qr-cell" style={{ opacity: Math.random() > 0.45 ? 1 : 0 }} />
                ))}
              </div>
            </div>
            <div className="pp-passport-id">{passportId}</div>
            <div className="pp-passport-id-label">Passport ID</div>
          </div>
        </div>
      </div>

      {/* ── Lifecycle Timeline ── */}
      <div className="pp-section">
        <div className="pp-section-title">Product Lifecycle</div>
        <div className="pp-timeline">
          {STAGES.map((stage, i) => {
            const done = stagesDone.has(stage.key);
            const isOutcome = stage.key === "outcome";
            const outcomeIcon = disMeta?.icon || "🌱";
            const outcomeLabel = disMeta?.label || "Pending";
            return (
              <div key={stage.key} className={`pp-tl-step ${done ? "pp-tl-step--done" : "pp-tl-step--pending"}`}>
                <div className="pp-tl-dot">
                  {done ? <span className="pp-tl-check">✓</span> : <span className="pp-tl-num">{i + 1}</span>}
                </div>
                {i < STAGES.length - 1 && <div className={`pp-tl-line ${done ? "pp-tl-line--done" : ""}`} />}
                <div className="pp-tl-body">
                  <div className="pp-tl-icon">{isOutcome && done ? outcomeIcon : stage.icon}</div>
                  <div className="pp-tl-label">{isOutcome && done ? outcomeLabel : stage.label}</div>
                  <div className="pp-tl-sub">
                    {stage.key === "manufactured" && "Product origin"}
                    {stage.key === "purchased" && (purchaseEvent ? fmt(purchaseEvent.date) : "—")}
                    {stage.key === "inspected" && (aiInspection ? `${aiInspection.grade || "Graded"}` : "—")}
                    {stage.key === "returned" && (returnEvent ? fmt(returnEvent.date) : "—")}
                    {stage.key === "outcome" && (done ? (listing?.isAvailable === false ? "Sold" : "Active") : "Awaiting")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two-column grid: AI Certificate + Impact ── */}
      <div className="pp-grid-2">

        {/* AI Grading Certificate */}
        <div className="pp-card pp-card--light">
          <div className="pp-card-header">
            <span className="pp-card-icon">✨</span>
            <span className="pp-card-title">AI Grading Certificate</span>
          </div>
          {aiInspection ? (
            <>
              <div className="pp-cert-row">
                <ScoreRing score={aiInspection.score ?? 0} />
                <div className="pp-cert-meta">
                  <div className="pp-cert-grade-row">
                    <span className="pp-cert-label">Grade</span>
                    {aiInspection.grade
                      ? <GradeBadge grade={aiInspection.grade} />
                      : <span className="pp-cert-na">—</span>
                    }
                  </div>
                  <div className="pp-cert-disp-row">
                    <span className="pp-cert-label">Disposition</span>
                    {disMeta ? (
                      <span className="pp-disp-chip" style={{ color: disMeta.color }}>
                        {disMeta.icon} {disMeta.label}
                      </span>
                    ) : <span className="pp-cert-na">—</span>}
                  </div>
                  {aiInspection.confidence != null && (
                    <div className="pp-cert-disp-row">
                      <span className="pp-cert-label">AI Confidence</span>
                      <span className="pp-cert-value">{aiInspection.confidence}%</span>
                    </div>
                  )}
                </div>
              </div>

              {aiInspection.reasoning && (
                <div className="pp-reasoning">
                  <span className="pp-reasoning-label">AI Reasoning</span>
                  <p className="pp-reasoning-text">{aiInspection.reasoning}</p>
                </div>
              )}

              {aiInspection.issues?.length > 0 && (
                <div className="pp-issues">
                  <span className="pp-issues-label">Detected Issues</span>
                  <ul className="pp-issues-list">
                    {aiInspection.issues.map((iss, i) => (
                      <li key={i}>⚠️ {iss}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInspection.inspectedAt && (
                <div className="pp-cert-date">Inspected on {fmt(aiInspection.inspectedAt)}</div>
              )}
            </>
          ) : (
            <div className="pp-card-empty">No AI inspection on record yet.</div>
          )}
        </div>

        {/* Environmental Impact */}
        <div className="pp-card pp-card--light">
          <div className="pp-card-header">
            <span className="pp-card-icon">🌍</span>
            <span className="pp-card-title">Environmental Impact</span>
          </div>
          <div className="pp-impact-grid">
            <div className="pp-impact-tile pp-impact-tile--green">
              <div className="pp-impact-val">{impact?.carbonSaved > 0 ? `${impact.carbonSaved} kg` : "—"}</div>
              <div className="pp-impact-key">CO₂ Saved</div>
              <div className="pp-impact-sub">vs. landfill disposal</div>
            </div>
            <div className="pp-impact-tile pp-impact-tile--blue">
              <div className="pp-impact-val">{impact?.logisticsSaved > 0 ? `₹${impact.logisticsSaved}` : "—"}</div>
              <div className="pp-impact-key">Logistics Saved</div>
              <div className="pp-impact-sub">reverse shipping cost</div>
            </div>
            <div className="pp-impact-tile pp-impact-tile--gold">
              <div className="pp-impact-val">{impact?.greenCredits > 0 ? `+${impact.greenCredits}` : "—"}</div>
              <div className="pp-impact-key">Green Credits</div>
              <div className="pp-impact-sub">earned on this return</div>
            </div>
          </div>

          {listing && (
            <div className="pp-listing-strip">
              <div className="pp-listing-strip-top">
                <span className="pp-listing-icon">🌿</span>
                <span className="pp-listing-label">Second Life Listing</span>
                <span className={`pp-listing-status ${listing.isAvailable ? "pp-listing-status--live" : "pp-listing-status--sold"}`}>
                  {listing.isAvailable ? "LIVE" : "SOLD"}
                </span>
              </div>
              <div className="pp-listing-price">
                Listed at <b>₹{listing.suggestedPrice?.toLocaleString("en-IN")}</b>
                {listing.grade && <span className="pp-listing-grade"> · {listing.grade}</span>}
              </div>
              <Link to="/second-life" className="pp-listing-link">View on Second Life →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Chain of Custody ── */}
      <div className="pp-section">
        <div className="pp-section-title">Chain of Custody</div>
        <div className="pp-custody-chain">
          <div className="pp-custody-node pp-custody-node--done">
            <div className="pp-custody-icon">🛒</div>
            <div className="pp-custody-name">You</div>
            <div className="pp-custody-sub">{purchaseEvent ? fmt(purchaseEvent.date) : "Customer"}</div>
          </div>
          <div className={`pp-custody-arrow ${returnEvent ? "pp-custody-arrow--done" : ""}`}>→</div>
          <div className={`pp-custody-node ${returnEvent ? "pp-custody-node--done" : "pp-custody-node--pending"}`}>
            <div className="pp-custody-icon">🏭</div>
            <div className="pp-custody-name">Amazon IHS Store</div>
            <div className="pp-custody-sub">{returnEvent ? "Received" : "Awaiting"}</div>
          </div>
          <div className={`pp-custody-arrow ${stagesDone.has("outcome") ? "pp-custody-arrow--done" : ""}`}>→</div>
          <div className={`pp-custody-node ${stagesDone.has("outcome") ? "pp-custody-node--done" : "pp-custody-node--pending"}`}>
            <div className="pp-custody-icon">{disMeta?.icon || "⏳"}</div>
            <div className="pp-custody-name">{disMeta?.label || "Next Stage"}</div>
            <div className="pp-custody-sub">
              {currentStage === "sold" ? "Sold to buyer"
                : currentStage === "relisted" ? "Awaiting buyer"
                : currentStage === "recycled" ? "At recycling center"
                : "Pending"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Footer ── */}
      <div className="pp-footer">
        {returnEvent && (
          <Link to={`/returns/tracking/${returnEvent.returnId}`} className="pp-footer-btn pp-footer-btn--primary">
            📦 Track Return
          </Link>
        )}
        {listing?.isAvailable && (
          <Link to="/second-life" className="pp-footer-btn pp-footer-btn--green">
            🌿 View on Second Life
          </Link>
        )}
        <Link to="/returns" className="pp-footer-btn pp-footer-btn--ghost">
          ← All Returns
        </Link>
      </div>

    </div>
  );
}

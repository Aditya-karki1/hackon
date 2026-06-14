import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../styles/ReturnTracking.css";

const WAREHOUSES = [
  { id: "W01", name: "Mumbai Fulfilment Centre", city: "Mumbai", state: "Maharashtra", lat: 19.1136, lng: 72.8697, address: "Bhiwandi Industrial Area, Mumbai 421302" },
  { id: "W02", name: "Delhi NCR Fulfilment Centre", city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, address: "Sector 68, Noida, Delhi NCR 201301" },
  { id: "W03", name: "Bengaluru Fulfilment Centre", city: "Bengaluru", state: "Karnataka", lat: 13.0570, lng: 77.6376, address: "Whitefield Road, Bengaluru 560066" },
  { id: "W04", name: "Hyderabad Fulfilment Centre", city: "Hyderabad", state: "Telangana", lat: 17.4483, lng: 78.3915, address: "Patancheru, Hyderabad 502319" },
  { id: "W05", name: "Chennai Fulfilment Centre", city: "Chennai", state: "Tamil Nadu", lat: 13.1827, lng: 80.2707, address: "Ambattur Industrial Estate, Chennai 600058" },
  { id: "W06", name: "Kolkata Fulfilment Centre", city: "Kolkata", state: "West Bengal", lat: 22.6760, lng: 88.4563, address: "Rajarhat New Town, Kolkata 700135" },
  { id: "W07", name: "Pune Fulfilment Centre", city: "Pune", state: "Maharashtra", lat: 18.6298, lng: 73.7997, address: "Chakan MIDC, Pune 410501" },
  { id: "W08", name: "Ahmedabad Fulfilment Centre", city: "Ahmedabad", state: "Gujarat", lat: 23.0738, lng: 72.6346, address: "Changodar GIDC, Ahmedabad 382213" },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestWarehouse(userLat, userLng) {
  let best = null;
  let bestDist = Infinity;
  for (const w of WAREHOUSES) {
    const d = haversineKm(userLat, userLng, w.lat, w.lng);
    if (d < bestDist) { bestDist = d; best = w; }
  }
  return { warehouse: best, distanceKm: Math.round(bestDist) };
}

function pickupDays(km) {
  if (km < 100) return "1–2 business days";
  if (km < 300) return "2–3 business days";
  if (km < 600) return "3–5 business days";
  return "5–7 business days";
}

const TIMELINE_STEPS = [
  { label: "Return Requested", sublabel: "Your request has been received", icon: "📋", key: "requested" },
  { label: "Pickup Scheduled", sublabel: "Driver will be assigned soon", icon: "📅", key: "pickup" },
  { label: "Item Collected", sublabel: "Item picked up from your location", icon: "🚚", key: "collected" },
  { label: "At IHS Store", sublabel: "Item received and under inspection", icon: "🏭", key: "warehouse" },
  { label: "Refund Processed", sublabel: "Amount credited to your account", icon: "✅", key: "refund" },
];

export default function ReturnTracking() {
  const { returnId } = useParams();
  const [returnReq, setReturnReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locState, setLocState] = useState("idle");
  const [userCoords, setUserCoords] = useState(null);
  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [idCopied, setIdCopied] = useState(false);

  const handleCopyId = useCallback(() => {
    const shortId = returnId.slice(-10).toUpperCase();
    navigator.clipboard.writeText(shortId).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  }, [returnId]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/returns/${returnId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReturnReq(res.data);
      } catch (err) {
        console.error("Error fetching return:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturn();
  }, [returnId, API_BASE_URL, token]);

  useEffect(() => {
    if (!navigator.geolocation) {
      const { warehouse, distanceKm } = nearestWarehouse(12.9716, 77.5946);
      setWarehouseInfo({ warehouse, distanceKm });
      setLocState("done");
      return;
    }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const { warehouse, distanceKm } = nearestWarehouse(latitude, longitude);
        setWarehouseInfo({ warehouse, distanceKm });
        setLocState("done");
      },
      () => {
        const { warehouse, distanceKm } = nearestWarehouse(28.6139, 77.2090);
        setWarehouseInfo({ warehouse, distanceKm });
        setLocState("denied");
      },
      { timeout: 6000 }
    );
  }, []);

  const mapsEmbedUrl = userCoords && warehouseInfo
    ? `https://maps.google.com/maps?saddr=${userCoords.lat},${userCoords.lng}&daddr=${warehouseInfo.warehouse.lat},${warehouseInfo.warehouse.lng}&output=embed`
    : warehouseInfo
    ? `https://maps.google.com/maps?q=${warehouseInfo.warehouse.lat},${warehouseInfo.warehouse.lng}&output=embed`
    : null;

  const mapsOpenUrl = userCoords && warehouseInfo
    ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${warehouseInfo.warehouse.lat},${warehouseInfo.warehouse.lng}&travelmode=driving`
    : warehouseInfo
    ? `https://www.google.com/maps/search/?api=1&query=${warehouseInfo.warehouse.lat},${warehouseInfo.warehouse.lng}`
    : "#";

  if (loading) {
    return (
      <div className="rt-page">
        <div className="rt-loading-screen">
          <div className="rt-spinner" />
          <p>Loading return details…</p>
        </div>
      </div>
    );
  }

  if (!returnReq) {
    return (
      <div className="rt-page">
        <div className="rt-loading-screen">
          <p>Return not found. <Link to="/returns">Go back</Link></p>
        </div>
      </div>
    );
  }

  const requestDate = new Date(returnReq.requestedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const requestTime = new Date(returnReq.requestedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rt-page">

      {/* ── Top Header ── */}
      <div className="rt-hero">
        <div className="rt-hero-inner">
          <Link to="/returns" className="rt-back-btn">
            <span>←</span> Back to Returns
          </Link>

          <div className="rt-hero-content">
            <div className="rt-hero-left">
              <div className="rt-status-pill">
                <span className="rt-status-dot" />
                {returnReq.status || "In Process"}
              </div>
              <h1 className="rt-hero-title">
                {["Approved","Completed","Refunded"].includes(returnReq.status)
                  ? "Return Completed ✅"
                  : returnReq.status === "Rejected"
                  ? "Return Rejected"
                  : "Return In Progress"}
              </h1>
              <p className="rt-hero-id" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Return ID: #{returnId.slice(-10).toUpperCase()}
                <button
                  onClick={handleCopyId}
                  style={{ background: idCopied ? "#dcfce7" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: idCopied ? "#166534" : "#fff", transition: "all 0.2s" }}
                >
                  {idCopied ? "✓ Copied!" : "Copy"}
                </button>
              </p>
              <p className="rt-hero-date">Submitted on {requestDate} at {requestTime}</p>
            </div>
            <div className="rt-hero-icon-wrap">
              <div className="rt-hero-icon">📦</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="rt-content">

        {/* Left column */}
        <div className="rt-left-col">

          {/* Product Card */}
          <div className="rt-card rt-product-card">
            <div className="rt-card-header">
              <span className="rt-card-header-icon">🛍️</span>
              <span className="rt-card-header-title">Product Details</span>
            </div>
            <div className="rt-product-body">
              <div className="rt-product-img-wrap">
                <img src={returnReq.productImage} alt={returnReq.productName} className="rt-product-img" />
              </div>
              <div className="rt-product-info">
                <p className="rt-product-name">{returnReq.productName}</p>
                <div className="rt-product-badges">
                  <span className="rt-badge rt-badge-qty">Qty: {returnReq.quantity}</span>
                  <span className="rt-badge rt-badge-price">₹{returnReq.productPrice?.toLocaleString("en-IN")}</span>
                </div>
                <div className="rt-reason-box">
                  <span className="rt-reason-label">Return Reason</span>
                  <span className="rt-reason-value">{returnReq.reason}</span>
                </div>
                <div className="rt-refund-row">
                  <span className="rt-refund-label">Refund Amount</span>
                  <span className="rt-refund-amount">₹{(returnReq.productPrice * returnReq.quantity)?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rt-card rt-timeline-card">
            <div className="rt-card-header">
              <span className="rt-card-header-icon">📍</span>
              <span className="rt-card-header-title">Return Progress</span>
            </div>
            <div className="rt-timeline">
              {(() => {
                const s = returnReq.status || "In Process";
                const doneCount =
                  s === "Approved" || s === "Completed" || s === "Refunded" ? 5
                  : s === "At Warehouse" ? 3
                  : s === "Collected" || s === "Item Collected" ? 2
                  : s === "Driver Assigned" || s === "Pickup Scheduled" ? 1
                  : 1; // "In Process" / default → step 0 done, step 1 active
                return TIMELINE_STEPS.map((step, i) => {
                const isDone   = i < doneCount;
                const isActive = i === doneCount;
                return (
                  <div key={step.key} className={`rt-step ${isDone ? "rt-step--done" : isActive ? "rt-step--active" : "rt-step--pending"}`}>
                    <div className="rt-step-left">
                      <div className="rt-step-dot">
                        {isDone ? "✓" : isActive ? <span className="rt-pulse-ring" /> : null}
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`rt-step-line ${isDone ? "rt-step-line--done" : ""}`} />
                      )}
                    </div>
                    <div className="rt-step-body">
                      <div className="rt-step-icon">{step.icon}</div>
                      <div>
                        <div className="rt-step-label">{step.label}</div>
                        <div className="rt-step-sublabel">{step.sublabel}</div>
                      </div>
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>
        </div>

        {/* Right column — Warehouse & Map */}
        <div className="rt-right-col">
          <div className="rt-card rt-warehouse-card">
            <div className="rt-card-header">
              <span className="rt-card-header-icon">🏭</span>
              <span className="rt-card-header-title">Nearest IHS Store</span>
            </div>

            {/* Location status */}
            {locState === "loading" && (
              <div className="rt-loc-note">
                <span className="rt-loc-spinner" /> Detecting your location…
              </div>
            )}
            {locState === "denied" && (
              <div className="rt-loc-note rt-loc-denied">
                ⚠️ Location access denied — showing nearest to Delhi.
              </div>
            )}

            {warehouseInfo && (
              <>
                {/* Warehouse info banner */}
                <div className="rt-warehouse-banner">
                  <div className="rt-warehouse-icon-wrap">🏬</div>
                  <div className="rt-warehouse-info">
                    <div className="rt-warehouse-name">{warehouseInfo.warehouse.name}</div>
                    <div className="rt-warehouse-addr">{warehouseInfo.warehouse.address}</div>
                    <div className="rt-warehouse-state">{warehouseInfo.warehouse.city}, {warehouseInfo.warehouse.state}</div>
                  </div>
                  <div className="rt-distance-chip">
                    <span className="rt-distance-num">{warehouseInfo.distanceKm}</span>
                    <span className="rt-distance-unit">km</span>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="rt-stats-strip">
                  <div className="rt-stat-item">
                    <span className="rt-stat-icon">🚚</span>
                    <div>
                      <div className="rt-stat-value">{pickupDays(warehouseInfo.distanceKm)}</div>
                      <div className="rt-stat-label">Estimated Pickup</div>
                    </div>
                  </div>
                  <div className="rt-stat-divider" />
                  <div className="rt-stat-item">
                    <span className="rt-stat-icon">📏</span>
                    <div>
                      <div className="rt-stat-value">{warehouseInfo.distanceKm} km</div>
                      <div className="rt-stat-label">Distance</div>
                    </div>
                  </div>
                  <div className="rt-stat-divider" />
                  <div className="rt-stat-item">
                    <span className="rt-stat-icon">💰</span>
                    <div>
                      <div className="rt-stat-value">Free</div>
                      <div className="rt-stat-label">Pickup Cost</div>
                    </div>
                  </div>
                </div>

                {/* Google Maps Embed */}
                {mapsEmbedUrl && (
                  <div className="rt-map-wrap">
                    <div className="rt-map-label">
                      {userCoords ? "📍 Route from your location" : "📍 IHS Store location"}
                    </div>
                    <iframe
                      title="IHS Store Map"
                      src={mapsEmbedUrl}
                      width="100%"
                      height="340"
                      style={{ border: "none" }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}

                {/* Open in Maps button */}
                <a
                  href={mapsOpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rt-maps-btn"
                >
                  <span>🗺️</span>
                  {userCoords ? "Get Directions in Google Maps" : "View IHS Store on Google Maps"}
                  <span className="rt-maps-btn-arrow">→</span>
                </a>
              </>
            )}
          </div>

          {/* Driver Info card */}
          {(() => {
            const s = returnReq.status || "In Process";
            const hasDriver = returnReq.assignedDriver?.name;
            const showPending = ["In Process", "Pickup Scheduled"].includes(s) && !hasDriver;
            if (!hasDriver && !showPending) return null;
            return (
              <div className="rt-card rt-driver-card">
                <div className="rt-card-header">
                  <span className="rt-card-header-icon">🚚</span>
                  <span className="rt-card-header-title">Pickup Driver</span>
                </div>
                {hasDriver ? (
                  <div className="rt-driver-body">
                    <div className="rt-driver-avatar">{returnReq.assignedDriver.name[0]}</div>
                    <div className="rt-driver-info">
                      <div className="rt-driver-name">{returnReq.assignedDriver.name}</div>
                      <div className="rt-driver-meta">{returnReq.assignedDriver.vehicle}</div>
                      <div className="rt-driver-meta">{returnReq.assignedDriver.phone}</div>
                    </div>
                    <span className="rt-driver-badge">Driver Assigned</span>
                  </div>
                ) : (
                  <div className="rt-driver-pending">
                    <span className="rt-loc-spinner" /> Matching a driver near you…
                  </div>
                )}
              </div>
            );
          })()}

          {/* Passport card */}
          {returnReq.productId && (
            <div className="rt-card rt-passport-card">
              <div className="rt-passport-icon">🛂</div>
              <div className="rt-help-text">
                <div className="rt-help-title">Product Passport</div>
                <div className="rt-help-sub">View AI inspection, lifecycle & eco-impact for this item.</div>
              </div>
              <Link to={`/passport/${returnReq.productId}`} className="rt-passport-btn">
                View Passport →
              </Link>
            </div>
          )}

          {/* Help card */}
          <div className="rt-card rt-help-card">
            <div className="rt-help-icon">💬</div>
            <div className="rt-help-text">
              <div className="rt-help-title">Need Help?</div>
              <div className="rt-help-sub">Our support team is available 24/7 to assist with your return.</div>
            </div>
            <Link to="/support" className="rt-help-btn">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "../styles/SecondLife.css";

// ── Geo utilities ────────────────────────────────────────────
function seededRand(n) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

function listingGeo(userLat, userLng, listingId) {
  const seed = listingId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const distKm = seededRand(seed * 7) * 58 + 2;    // 2–60 km
  const angle  = seededRand(seed * 13) * 2 * Math.PI;
  const dLat = (distKm / 111) * Math.cos(angle);
  const dLng = (distKm / (111 * Math.cos((userLat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: userLat + dLat, lng: userLng + dLng, distKm: Math.round(distKm * 10) / 10 };
}

// ── Second Life Map (Leaflet) ────────────────────────────────
function SecondLifeMap({ userCoords, listingsGeo }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !userCoords) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    if (!leafletRef.current) {
      leafletRef.current = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletRef.current);
    }
    const map = leafletRef.current;
    map.setView([userCoords.lat, userCoords.lng], 10);
    map.eachLayer((l) => { if (!(l instanceof L.TileLayer)) map.removeLayer(l); });

    // 60 km radius circle
    L.circle([userCoords.lat, userCoords.lng], {
      radius: 60000,
      color: "#059669",
      fillColor: "#059669",
      fillOpacity: 0.05,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // User pin
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))">📍</div>`,
      iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
    });
    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("<b>📍 Your Location</b><br/>Showing listings within 60 km");

    // Listing pins
    const GRADE_COLORS_HEX = { "Like New": "#16a34a", Good: "#2563eb", Fair: "#d97706", Salvage: "#dc2626" };
    listingsGeo.forEach(({ listing, geo }) => {
      const color = GRADE_COLORS_HEX[listing.aiGrade] || "#6b7280";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10],
      });
      const imgTag = listing.productImage
        ? `<img src="${listing.productImage}" style="width:100%;height:64px;object-fit:contain;border-radius:6px;margin-bottom:5px"/>`
        : "";
      const sellerTag = listing.isP2P && listing.sellerName
        ? `<div style="font-size:11px;color:#6b7280;margin-top:3px">👤 ${listing.sellerName}</div>`
        : `<div style="font-size:11px;color:#059669;margin-top:3px">✅ Amazon Verified</div>`;
      L.marker([geo.lat, geo.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px">
            ${imgTag}
            <div style="font-size:13px;font-weight:700;color:#131921">${listing.productName}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:4px">${listing.productBrand || ""}</div>
            <div style="font-size:12px;color:#059669;font-weight:700">₹${listing.suggestedPrice?.toLocaleString("en-IN")}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:3px">📍 ${geo.distKm} km away</div>
            ${sellerTag}
          </div>
        `, { maxWidth: 210 });
    });
  }, [userCoords, listingsGeo]);

  useEffect(() => () => { leafletRef.current?.remove(); leafletRef.current = null; }, []);

  if (!userCoords) return null;
  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

function daysLeftInStore(createdAt) {
  if (!createdAt) return 30;
  const diffDays = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  return Math.max(0, 30 - diffDays);
}

const GRADE_ORDER = ["Like New", "Good", "Fair", "Salvage"];

const BASE_CATEGORY_CREDITS = {
  Shoes: 20, Bags: 18, BottomWear: 15, Tshirt: 12, Caps: 10,
  Electronics: 30, Mobiles: 30, Laptops: 30, Furniture: 22, Books: 8,
};

const GRADE_COLORS = {
  "Like New": { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  Good:       { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  Fair:       { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  Salvage:    { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

const AVATAR_COLORS = [
  "#0ea5e9","#8b5cf6","#f97316","#10b981","#ef4444","#ec4899","#f59e0b","#06b6d4",
];

function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function SellerAvatar({ name, size = 36 }) {
  const bg = avatarColor(name);
  return (
    <div className="slSellerAvatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function GradeBadge({ grade }) {
  const c = GRADE_COLORS[grade] || GRADE_COLORS.Good;
  return (
    <span className="slGradeBadge" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {grade}
    </span>
  );
}

function ConditionBar({ score }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#2563eb" : score >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="slConditionBar">
      <span className="slConditionLabel">Condition {score}/100</span>
      <div className="slConditionTrack">
        <div className="slConditionFill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Purchase Confirmation Modal ──────────────────────────────
function PurchaseModal({ listing, onConfirm, onCancel, loading }) {
  if (!listing) return null;
  return (
    <div className="slModalOverlay" onClick={onCancel}>
      <div className="slModal" onClick={(e) => e.stopPropagation()}>
        <div className="slModalHeader">
          <h3 className="slModalTitle">Confirm Purchase</h3>
          <button className="slModalClose" onClick={onCancel}>✕</button>
        </div>

        {listing.isP2P && (
          <div className="slModalSellerRow">
            <SellerAvatar name={listing.sellerName} size={44} />
            <div>
              <div className="slModalSellerName">{listing.sellerName}</div>
              <div className="slModalSellerLoc">📍 {listing.sellerLocation}</div>
            </div>
          </div>
        )}

        <div className="slModalProductRow">
          <img src={listing.productImage} alt={listing.productName} className="slModalImg" />
          <div>
            <div className="slModalBrand">{listing.productBrand}</div>
            <div className="slModalProductName">{listing.productName}</div>
            <div className="slModalPriceRow">
              <span className="slModalOrig">₹{listing.originalPrice?.toLocaleString("en-IN")}</span>
              <span className="slModalArrow">→</span>
              <span className="slModalSale">₹{listing.suggestedPrice?.toLocaleString("en-IN")}</span>
              <GradeBadge grade={listing.aiGrade} />
            </div>
          </div>
        </div>

        <div className="slModalCreditsNote">
          🌿 You'll earn <b>+15 Green Credits</b> for buying pre-owned
        </div>

        <div className="slModalActions">
          <button className="slModalCancel" onClick={onCancel}>Cancel</button>
          <button className="slModalConfirm" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing…" : `Buy for ₹${listing.suggestedPrice?.toLocaleString("en-IN")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success toast ────────────────────────────────────────────
function PurchaseSuccessToast({ listing, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  const earned    = listing?.earned ?? 15;
  const breakdown = listing?.breakdown;
  return (
    <div className="slToast slToast--wide">
      <span className="slToastIcon">🎉</span>
      <div style={{ flex: 1 }}>
        <div className="slToastTitle">Purchase complete! +{earned} Green Credits</div>
        {breakdown && (
          <div className="slToastBreakdown">
            <span>Base ({breakdown.category}): {breakdown.base}</span>
            <span>+</span>
            <span>{breakdown.kmAvoided} km × 0.05 = {breakdown.fromKm}</span>
            <span>+</span>
            <span>Score {breakdown.gradeScore} × 0.1 = {breakdown.fromGrade}</span>
          </div>
        )}
        <div className="slToastSub">
          {listing?.isP2P ? `Picked up locally from ${listing.sellerName}` : "IHS local pickup — no long-haul delivery"}
        </div>
      </div>
      <button className="slToastClose" onClick={onClose}>✕</button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
const SecondLife = () => {
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState("all");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [modalListing, setModalListing] = useState(null);
  const [buying, setBuying]           = useState(false);
  const [bought, setBought]           = useState({});
  const [toast, setToast]             = useState(null);
  const [userCoords, setUserCoords]   = useState(null);
  const [sortBy, setSortBy]           = useState("default");
  const [hideSold, setHideSold]       = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Live geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserCoords({ lat: 12.9716, lng: 77.5946 }); // Bengaluru fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords({ lat: 28.6139, lng: 77.2090 }), // Delhi fallback
      { timeout: 6000 }
    );
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/second-life`)
      .then((res) => setListings(res.data))
      .catch((err) => console.error("Error fetching listings:", err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  // Derived lists
  const p2pListings  = listings.filter((l) => l.isP2P);
  const stdListings  = listings.filter((l) => !l.isP2P);

  const tabListings =
    tab === "community" ? p2pListings :
    tab === "ihs"       ? stdListings :
    tab === "verified"  ? stdListings : listings;

  const gradeFiltered = gradeFilter === "All"
    ? tabListings
    : tabListings.filter((l) => l.aiGrade === gradeFilter);

  const sortedFiltered = [...gradeFiltered].sort((a, b) => {
    if (sortBy === "price-asc")  return a.suggestedPrice - b.suggestedPrice;
    if (sortBy === "price-desc") return b.suggestedPrice - a.suggestedPrice;
    if (sortBy === "distance" && userCoords) {
      const geoA = listingGeo(userCoords.lat, userCoords.lng, a._id);
      const geoB = listingGeo(userCoords.lat, userCoords.lng, b._id);
      return geoA.distKm - geoB.distKm;
    }
    return 0;
  });

  const filtered = hideSold
    ? sortedFiltered.filter((l) => l.isAvailable && !bought[l._id])
    : sortedFiltered;

  // Map syncs to the currently filtered (pre-hide-sold) grade-filtered set
  const listingsGeo = userCoords
    ? gradeFiltered.map((l) => ({ listing: l, geo: listingGeo(userCoords.lat, userCoords.lng, l._id) }))
    : [];

  // Unique sellers for spotlight
  const sellers = Object.values(
    p2pListings.reduce((acc, l) => {
      if (l.sellerName && !acc[l.sellerName]) {
        acc[l.sellerName] = { name: l.sellerName, location: l.sellerLocation, listingId: l._id, count: 0, grade: l.aiGrade };
      }
      if (l.sellerName) acc[l.sellerName].count++;
      return acc;
    }, {})
  );

  const handleBuyClick = (listing) => {
    if (!token) { navigate("/signin"); return; }
    setModalListing(listing);
  };

  const handleConfirmBuy = async () => {
    if (!modalListing) return;
    setBuying(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/second-life/buy/${modalListing._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const earned = res.data?.buyerCredits?.credits ?? 15;
      setBought((p) => ({ ...p, [modalListing._id]: { earned, breakdown: res.data?.buyerCredits?.breakdown } }));
      setListings((prev) =>
        prev.map((l) => l._id === modalListing._id ? { ...l, isAvailable: false } : l)
      );
      const existing = parseInt(localStorage.getItem("greenCredits") || "0");
      localStorage.setItem("greenCredits", existing + earned);
      window.dispatchEvent(new Event("greenCreditsUpdated"));
      setToast({ ...modalListing, earned, breakdown: res.data?.buyerCredits?.breakdown });
      setModalListing(null);
    } catch {
      alert("Failed to purchase. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="slPage">
      {/* Header */}
      <div className="slHeader">
        <div className="slHeaderContent">
          <Link to="/" className="slBackLink">&#10094; Back to Home</Link>
          <div className="slHeaderRow">
            <div>
              <h1 className="slTitle">🌿 Second Life Marketplace</h1>
              <p className="slSubtitle">
                Buy pre-owned items graded by AI — from verified stock or directly from community sellers.
              </p>
            </div>
            {token && (
              <Link to="/second-life/sell" className="slSellBtn">+ List an Item</Link>
            )}
          </div>
          <div className="slTrustRow">
            <span className="slTrustBadge">✅ Amazon Verified Grading</span>
            <span className="slTrustBadge">🤖 AI Quality Score</span>
            <span className="slTrustBadge">🌱 Carbon Impact Tracked</span>
            <span className="slTrustBadge">🌿 Earn 15 pts per purchase</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="slTabBar">
        <div className="slTabs">
          <button className={`slTab ${tab === "all" ? "slTab--active" : ""}`} onClick={() => setTab("all")}>
            All Listings <span className="slTabCount">{listings.length}</span>
          </button>
          <button className={`slTab ${tab === "community" ? "slTab--active" : ""}`} onClick={() => setTab("community")}>
            👥 Community Sellers <span className="slTabCount">{p2pListings.length}</span>
          </button>
          <button className={`slTab ${tab === "ihs" ? "slTab--active" : ""}`} onClick={() => setTab("ihs")}>
            🏭 At IHS Store <span className="slTabCount">{stdListings.length}</span>
          </button>
        </div>
      </div>

      {/* Seller spotlight — only on community tab */}
      {tab === "community" && sellers.length > 0 && (
        <div className="slSpotlightWrap">
          <div className="slSpotlightLabel">Active sellers</div>
          <div className="slSpotlightRow">
            {sellers.map((s) => (
              <div key={s.name} className="slSpotlightCard">
                <SellerAvatar name={s.name} size={44} />
                <div className="slSpotlightInfo">
                  <div className="slSpotlightName">{s.name}</div>
                  <div className="slSpotlightMeta">
                    {userCoords && s.listingId
                      ? `📍 ${listingGeo(userCoords.lat, userCoords.lng, s.listingId).distKm} km away`
                      : `📍 ${s.location}`}
                  </div>
                  <div className="slSpotlightMeta">{s.count} listing{s.count !== 1 ? "s" : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade filter */}
      <div className="slFilterBar">
        <span className="slFilterLabel">Grade:</span>
        {["All", ...GRADE_ORDER].map((g) => {
          const count = g === "All"
            ? tabListings.length
            : tabListings.filter((l) => l.aiGrade === g).length;
          return (
            <button
              key={g}
              className={`slFilterBtn ${gradeFilter === g ? "slFilterBtn--active" : ""}`}
              onClick={() => setGradeFilter(g)}
            >
              {g}
              {count > 0 && (
                <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 11 }}>({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort + Hide-sold toolbar */}
      <div className="slSortBar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="slFilterLabel">Sort:</span>
          {[
            { value: "default",    label: "Default" },
            { value: "price-asc",  label: "Price ↑" },
            { value: "price-desc", label: "Price ↓" },
            { value: "distance",   label: "Nearest" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`slFilterBtn ${sortBy === opt.value ? "slFilterBtn--active" : ""}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          className={`slHideSoldBtn ${hideSold ? "slHideSoldBtn--active" : ""}`}
          onClick={() => setHideSold((h) => !h)}
        >
          {hideSold ? "✅ Hiding Sold" : "👁 Show All"}
        </button>
      </div>

      {/* Live Location Map */}
      {userCoords && listingsGeo.length > 0 && (
        <div className="slMapSection">
          <div className="slMapHeader">
            <span className="slMapTitle">📍 Listings Near You</span>
            <span className="slMapSubtitle">All {listings.length} items shown within 60 km of your location</span>
          </div>
          <div className="slMapContainer">
            <SecondLifeMap userCoords={userCoords} listingsGeo={listingsGeo} />
          </div>
        </div>
      )}

      {/* Listings grid */}
      <div className="slContent">
        {loading ? (
          <div className="slLoading"><div className="slSpinner" /><p>Loading marketplace…</p></div>
        ) : filtered.length === 0 ? (
          <div className="slEmpty">
            <div className="slEmptyIcon">🌿</div>
            <p>No listings found. {gradeFilter !== "All" && <button className="slFilterBtn slFilterBtn--active" onClick={() => setGradeFilter("All")}>Show All</button>}</p>
          </div>
        ) : (
          <div className="slGrid">
            {filtered.map((listing) => {
              const isSold = !listing.isAvailable || bought[listing._id];
              const geo = userCoords ? listingGeo(userCoords.lat, userCoords.lng, listing._id) : null;
              const dLeft = !listing.isP2P ? daysLeftInStore(listing.createdAt) : null;
              return (
                <div key={listing._id} className={`slCard ${isSold ? "slCard--sold" : ""} ${listing.isP2P ? "slCard--p2p" : ""}`}>
                  <div className="slCardImgWrap">
                    <img src={listing.productImage} alt={listing.productName} className="slCardImg" />
                    <GradeBadge grade={listing.aiGrade} />
                    {listing.isP2P && <span className="slP2PBadge">Community</span>}
                    {!listing.isP2P && <span className="slIHSBadge">🏭 IHS Store</span>}
                    {isSold && <div className="slSoldOverlay">Sold</div>}
                    {geo && <span className="slDistanceBadge">📍 {geo.distKm} km</span>}
                    {dLeft !== null && !isSold && (
                      <span className={`slDaysLeftBadge ${dLeft <= 5 ? "slDaysLeftBadge--urgent" : ""}`}>
                        ⏰ {dLeft}d left
                      </span>
                    )}
                  </div>

                  <div className="slCardBody">
                    <div className="slCardBrand">{listing.productBrand}</div>
                    <div className="slCardName">{listing.productName}</div>

                    <div className="slPriceRow">
                      <span className="slOriginalPrice">₹{listing.originalPrice?.toLocaleString("en-IN")}</span>
                      <span className="slArrow">→</span>
                      <span className="slSalePrice">₹{listing.suggestedPrice?.toLocaleString("en-IN")}</span>
                      <span className="slDiscount">
                        {Math.round((1 - listing.suggestedPrice / listing.originalPrice) * 100)}% off
                      </span>
                    </div>

                    <ConditionBar score={listing.conditionScore} />

                    {/* Seller strip — P2P */}
                    {listing.isP2P && listing.sellerName ? (
                      <div className="slSellerStrip">
                        <SellerAvatar name={listing.sellerName} size={32} />
                        <div className="slSellerStripInfo">
                          <div className="slSellerStripName">{listing.sellerName}</div>
                          <div className="slSellerStripLoc">📍 {geo ? `${geo.distKm} km away` : listing.sellerLocation}</div>
                        </div>
                        <span className="slSellerVerified">✅</span>
                      </div>
                    ) : (
                      <div className="slVerifiedStrip">
                        <span>✅ Amazon Verified Stock</span>
                        {geo && <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>📍 {geo.distKm} km</span>}
                      </div>
                    )}

                    <div className="slInfoRow">
                      <span className="slInfoChip slInfoChip--green">🌱 {listing.carbonSaved} kg CO₂</span>
                      <span className="slInfoChip slInfoChip--credits">
                        🌿 ~{Math.round(
                          (BASE_CATEGORY_CREDITS[listing.productCategory] ?? 15) +
                          ((listing.buyerDistance ?? 50) * 0.05) +
                          ((listing.conditionScore ?? 50) * 0.1)
                        )} pts
                      </span>
                    </div>

                    <button
                      className={`slBuyBtn ${isSold ? "slBuyBtn--sold" : ""}`}
                      onClick={() => !isSold && handleBuyClick(listing)}
                      disabled={isSold}
                    >
                      {isSold
                        ? "Sold Out"
                        : listing.isP2P
                        ? `Buy from ${listing.sellerName?.split(" ")[0]} →`
                        : "Buy Now · Second Life →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA banner */}
      <div className="slCtaBanner">
        <div className="slCtaContent">
          <h2>Have something to sell?</h2>
          <p>AI grades your item in seconds. List it and earn Green Credits.</p>
          <Link to="/second-life/sell" className="slCtaBtn">Start Selling →</Link>
        </div>
      </div>

      {/* Purchase modal */}
      <PurchaseModal
        listing={modalListing}
        onConfirm={handleConfirmBuy}
        onCancel={() => setModalListing(null)}
        loading={buying}
      />

      {/* Success toast */}
      {toast && <PurchaseSuccessToast listing={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SecondLife;

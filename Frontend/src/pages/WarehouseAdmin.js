import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "../styles/WarehouseAdmin.css";

// ── Leaflet is loaded imperatively via useEffect ───────────────

const PIN_CONFIG = {
  RESELL_LOCAL:      { color: "#2563eb", label: "Resell" },
  RECYCLE:           { color: "#7c3aed", label: "Recycle" },
  RETURN:            { color: "#dc2626", label: "Return" },
  REFURBISH:         { color: "#d97706", label: "Refurbish" },
  RETURNLESS_REFUND: { color: "#059669", label: "Refundless" },
  DONATE:            { color: "#db2777", label: "Donate" },
  Processing:        { color: "#6b7280", label: "Pending" },
};

function pinFor(disposition) {
  return PIN_CONFIG[disposition] || PIN_CONFIG.Processing;
}

function seededRandom(n) {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
}

function pinPosition(warehouseLat, warehouseLng, index) {
  const distKm = seededRandom(index * 7) * 17 + 2;
  const angle  = seededRandom(index * 13) * 2 * Math.PI;
  const dLat = (distKm / 111) * Math.cos(angle);
  const dLng = (distKm / (111 * Math.cos((warehouseLat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: warehouseLat + dLat, lng: warehouseLng + dLng };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestWarehouse(userLat, userLng) {
  let best = WAREHOUSES[0];
  let bestDist = Infinity;
  for (const w of WAREHOUSES) {
    const d = haversineKm(userLat, userLng, w.lat, w.lng);
    if (d < bestDist) { bestDist = d; best = w; }
  }
  return best;
}

// ── Radar Map (pure Leaflet, no react-leaflet) ─────────────────
function RadarMap({ warehouse, warehouseReturns, userCoords }) {
  const mapRef    = useRef(null); // DOM node
  const leafletRef = useRef(null); // L.Map instance

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const L = require("leaflet");

    // Fix broken default icon paths from webpack
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    if (!mapRef.current) return;

    // Init map only once
    if (!leafletRef.current) {
      leafletRef.current = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletRef.current);
    }

    const map = leafletRef.current;

    // Center: if user location available, fit bounds to show user + warehouse
    if (userCoords) {
      const bounds = L.latLngBounds(
        [userCoords.lat, userCoords.lng],
        [warehouse.lat, warehouse.lng]
      ).pad(0.3);
      map.fitBounds(bounds);
    } else {
      map.setView([warehouse.lat, warehouse.lng], 11);
    }

    // Clear previous layers except tile layer
    map.eachLayer((layer) => { if (!(layer instanceof L.TileLayer)) map.removeLayer(layer); });

    // 20 km radius circle around warehouse
    L.circle([warehouse.lat, warehouse.lng], {
      radius: 20000,
      color: "#ff9900",
      fillColor: "#ff9900",
      fillOpacity: 0.06,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // User live location pin
    if (userCoords) {
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });
      const distKm = Math.round(haversineKm(userCoords.lat, userCoords.lng, warehouse.lat, warehouse.lng));
      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Your Live Location</b><br/>${distKm} km from ${warehouse.city} IHS Store`);
    }

    // Warehouse pin
    const whIcon = L.divIcon({
      className: "",
      html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">🏭</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -20],
    });
    L.marker([warehouse.lat, warehouse.lng], { icon: whIcon })
      .addTo(map)
      .bindPopup(`<b>🏭 ${warehouse.city} IHS Store</b><br/>${warehouse.id} · ${warehouseReturns.length} items`);

    // Return / resell pins
    warehouseReturns.forEach((r, i) => {
      const pos  = pinPosition(warehouse.lat, warehouse.lng, i);
      const cfg  = pinFor(r.aiDisposition || r.status || "Processing");
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${cfg.color};width:13px;height:13px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
        iconSize: [13, 13],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
      });
      const imgTag = r.productImage
        ? `<img src="${r.productImage}" style="width:100%;height:70px;object-fit:contain;border-radius:6px;background:#f8fafc;border:1px solid #e5e7eb;margin-bottom:6px"/>`
        : "";
      const driverTag = r.assignedDriver?.name
        ? `<div style="margin-top:5px;font-size:11px;color:#059669;font-weight:600">🚚 ${r.assignedDriver.name}</div>`
        : "";
      L.marker([pos.lat, pos.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px">
            ${imgTag}
            <div style="font-size:13px;font-weight:700;color:#131921;margin-bottom:3px">${r.productName}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${r.productBrand || ""} · ₹${r.productPrice?.toLocaleString("en-IN")}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="background:${cfg.color};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${cfg.label}</span>
              <span style="font-size:11px;color:#6b7280">${r.daysInStorage === 0 ? "Today" : r.daysInStorage + "d stored"}</span>
            </div>
            ${driverTag}
          </div>
        `, { maxWidth: 220 });
    });
  }, [warehouse, warehouseReturns, userCoords]);

  // Cleanup on unmount
  useEffect(() => () => { leafletRef.current?.remove(); leafletRef.current = null; }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

// ── Warehouse list (mirrors backend) ──────────────────────────
const WAREHOUSES = [
  { id: "W01", name: "Mumbai",    city: "Mumbai",    lat: 19.1136, lng: 72.8697 },
  { id: "W02", name: "Delhi NCR", city: "Noida",     lat: 28.5355, lng: 77.3910 },
  { id: "W03", name: "Bengaluru", city: "Bengaluru", lat: 13.0570, lng: 77.6376 },
  { id: "W04", name: "Hyderabad", city: "Hyderabad", lat: 17.4483, lng: 78.3915 },
  { id: "W05", name: "Chennai",   city: "Chennai",   lat: 13.1827, lng: 80.2707 },
  { id: "W06", name: "Kolkata",   city: "Kolkata",   lat: 22.6760, lng: 88.4563 },
  { id: "W07", name: "Pune",      city: "Pune",      lat: 18.6298, lng: 73.7997 },
  { id: "W08", name: "Ahmedabad", city: "Ahmedabad", lat: 23.0738, lng: 72.6346 },
];

const STATUS_META = {
  "Driver Assigned": { label: "Driver Assigned", color: "#059669", bg: "#dcfce7" },
  "RESELL_LOCAL":    { label: "Resell",           color: "#2563eb", bg: "#dbeafe" },
  "REFURBISH":       { label: "Refurbish",        color: "#d97706", bg: "#fef3c7" },
  "RECYCLE":         { label: "Recycle",          color: "#7c3aed", bg: "#ede9fe" },
  "Processing":      { label: "Pending",          color: "#6b7280", bg: "#f3f4f6" },
};

const WarehouseAdmin = () => {
  const [returns, setReturns]     = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState({});
  const [assigning, setAssigning] = useState({});
  const [filter, setFilter]       = useState("all");
  const [activeWarehouse, setActiveWarehouse] = useState(WAREHOUSES[0]);
  const [userCoords, setUserCoords] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [invRes, drvRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/warehouse/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/warehouse/drivers`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setReturns(invRes.data);
      setDrivers(drvRes.data);
    } catch (err) {
      if (err.response?.status === 403) navigate("/signin");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token, navigate]);

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "warehouse") { navigate("/signin"); return; }
    fetchData();
  }, [fetchData, navigate]);

  // Live geolocation — auto-select nearest warehouse
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setActiveWarehouse(nearestWarehouse(latitude, longitude));
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const handleAssign = async (returnId) => {
    const driverId = selected[returnId];
    if (!driverId) return;
    setAssigning((p) => ({ ...p, [returnId]: true }));
    try {
      await axios.patch(
        `${API_BASE_URL}/api/warehouse/assign-driver/${returnId}`,
        { driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch {
      alert("Failed to assign driver.");
    } finally {
      setAssigning((p) => ({ ...p, [returnId]: false }));
    }
  };

  // Returns visible in current warehouse within the map
  const warehouseReturns = returns.filter((r) => r.warehouseId === activeWarehouse.id);

  // Disposition breakdown for legend
  const dispositionCounts = warehouseReturns.reduce((acc, r) => {
    const key = r.aiDisposition || r.status || "Processing";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const filtered = returns.filter((r) => {
    if (filter === "unassigned") return !r.assignedDriver?.driverId;
    if (filter === "assigned")   return  !!r.assignedDriver?.driverId;
    return true;
  });

  const unassignedCount = returns.filter((r) => !r.assignedDriver?.driverId).length;
  const assignedCount   = returns.filter((r) =>  !!r.assignedDriver?.driverId).length;

  return (
    <div className="whPage">
      {/* ── Header ── */}
      <div className="whHeader">
        <div className="whHeaderContent">
          <div className="whHeaderTop">
            <span className="whHeaderLogo">🏭 IHS Store Portal</span>
            <span className="whHeaderBadge"><span className="whLiveDot" />Staff</span>
          </div>
          <h1 className="whTitle">Driver Assignment</h1>
          <p className="whSubtitle">Assign delivery drivers to returned items for pickup and dispatch.</p>
          <div className="whStatPills">
            <div className="whStatPill"><span className="whStatPillVal">{returns.length}</span><span className="whStatPillKey">Total Returns</span></div>
            <div className="whStatPill whStatPill--orange"><span className="whStatPillVal">{unassignedCount}</span><span className="whStatPillKey">Awaiting Driver</span></div>
            <div className="whStatPill whStatPill--green"><span className="whStatPillVal">{assignedCount}</span><span className="whStatPillKey">Driver Assigned</span></div>
            <div className="whStatPill whStatPill--blue"><span className="whStatPillVal">{drivers.length}</span><span className="whStatPillKey">Active Drivers</span></div>
            <div className="whStatPill whStatPill--eco">
              <span className="whStatPillVal">{(assignedCount * 30 * 0.12).toFixed(1)} kg</span>
              <span className="whStatPillKey">🌍 CO₂ Saved (batched)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Radar Map Section ── */}
      <div className="whMapSection">
        <div className="whMapSectionInner">

          {/* Map header row */}
          <div className="whMapHeader">
            <div>
              <h2 className="whMapTitle">📍 20 km Pickup Radar</h2>
              <p className="whMapSubtitle">
                {userCoords
                  ? <>Live location detected · Nearest IHS Store: <strong>{activeWarehouse.city}</strong> · <strong>{warehouseReturns.length}</strong> item{warehouseReturns.length !== 1 ? "s" : ""} in zone</>
                  : <>Showing <strong>{warehouseReturns.length}</strong> item{warehouseReturns.length !== 1 ? "s" : ""} within 20 km of <strong>{activeWarehouse.city}</strong> IHS Store</>
                }
              </p>
            </div>
            <div className="whWarehouseSelector">
              <span className="whWarehouseSelectorLabel">Switch IHS Store:</span>
              <select
                className="whWarehouseSelect"
                value={activeWarehouse.id}
                onChange={(e) => {
                  const w = WAREHOUSES.find((x) => x.id === e.target.value);
                  if (w) setActiveWarehouse(w);
                }}
              >
                {WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>{w.city} ({w.id})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Map + Legend side-by-side */}
          <div className="whMapLayout">
            {/* Leaflet Map (imperative) */}
            <div className="whMapContainer">
              <RadarMap warehouse={activeWarehouse} warehouseReturns={warehouseReturns} userCoords={userCoords} />
            </div>

            {/* Legend + breakdown */}
            <div className="whMapLegend">
              <div className="whMapLegendTitle">Item Breakdown</div>
              <div className="whMapLegendRadius">
                <span className="whMapLegendRadiusDot" />
                20 km radius
              </div>

              {Object.entries(dispositionCounts).map(([key, count]) => {
                const cfg = pinFor(key);
                return (
                  <div key={key} className="whMapLegendRow">
                    <span className="whMapLegendDot" style={{ background: cfg.color }} />
                    <span className="whMapLegendLabel">{cfg.label}</span>
                    <span className="whMapLegendCount">{count}</span>
                  </div>
                );
              })}

              {warehouseReturns.length === 0 && (
                <div className="whMapLegendEmpty">No items assigned to this warehouse yet.</div>
              )}

              <div className="whMapLegendDivider" />
              <div className="whMapLegendRow">
                <span style={{ fontSize: 18 }}>🏭</span>
                <span className="whMapLegendLabel">Warehouse</span>
                <span className="whMapLegendCount">1</span>
              </div>
              {userCoords && (
                <div className="whMapLegendRow">
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span className="whMapLegendLabel">Your Location</span>
                  <span className="whMapLegendCount">Live</span>
                </div>
              )}

              <div className="whMapLegendDivider" />
              <div className="whMapLegendHint">
                {userCoords
                  ? "📍 Live location active — map auto-centred between you and nearest IHS Store."
                  : "Click any pin to see item details. Orange dashed circle = 20 km pickup zone."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Driver Roster ── */}
      <div className="whDriverRoster">
        <div className="whDriverRosterInner">
          <span className="whDriverRosterLabel">Available Drivers</span>
          {drivers.map((d) => (
            <div key={d.driverId} className="whDriverChip">
              <span className="whDriverChipAvatar">{d.name[0]}</span>
              <span className="whDriverChipName">{d.name.split(" ")[0]}</span>
              <span className="whDriverChipVehicle">{d.vehicle.split("·")[0].trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="whFilterBar">
        <div className="whFilterBarInner">
          {[
            { key: "all",        label: `All (${returns.length})` },
            { key: "unassigned", label: `Awaiting Driver (${unassignedCount})` },
            { key: "assigned",   label: `Assigned (${assignedCount})` },
          ].map((f) => (
            <button
              key={f.key}
              className={`whFilterTab ${filter === f.key ? "whFilterTab--active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="whContent">
        {loading ? (
          <div className="whLoading"><div className="whSpinner" /><p>Loading returns…</p></div>
        ) : filtered.length === 0 ? (
          <div className="whEmpty"><div className="whEmptyIcon">📦</div><p>No returns found.</p></div>
        ) : (
          <div className="whTable">
            <div className="whTableHead">
              <div>Item</div>
              <div>IHS Store</div>
              <div>Days Stored</div>
              <div>Status</div>
              <div>Assign Driver</div>
            </div>

            {filtered.map((r) => {
              const isAssigned = !!r.assignedDriver?.driverId;
              const statusMeta = STATUS_META[isAssigned ? "Driver Assigned" : r.aiDisposition] || STATUS_META.Processing;
              return (
                <div key={r._id} className={`whTableRow ${isAssigned ? "whTableRow--assigned" : ""}`}>
                  <div className="whTableItem">
                    <img src={r.productImage} alt={r.productName} className="whTableImg" />
                    <div>
                      <div className="whTableName">{r.productName}</div>
                      <div className="whTableBrand">{r.productBrand}</div>
                      <div className="whTablePrice">₹{r.productPrice?.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="whTableWarehouse">
                    <div className="whTableWarehouseName">{r.warehouse?.city}</div>
                    <div className="whTableWarehouseId">{r.warehouseId}</div>
                  </div>
                  <div className="whTableDays">
                    <span className={`whDaysBadge ${r.daysInStorage >= 25 ? "whDaysBadge--urgent" : ""}`}>
                      {r.daysInStorage === 0 ? "Today" : `${r.daysInStorage}d`}
                    </span>
                  </div>
                  <div>
                    <span className="whStatusBadge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="whTableAssign">
                    {isAssigned ? (
                      <div className="whAssignedInfo">
                        <div className="whAssignedAvatar">{r.assignedDriver.name[0]}</div>
                        <div>
                          <div className="whAssignedName">{r.assignedDriver.name}</div>
                          <div className="whAssignedPhone">{r.assignedDriver.phone}</div>
                          <div className="whAssignedVehicle">{r.assignedDriver.vehicle}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="whAssignRow">
                        <select
                          className="whDriverSelect"
                          value={selected[r._id] || ""}
                          onChange={(e) => setSelected((p) => ({ ...p, [r._id]: e.target.value }))}
                        >
                          <option value="">Select driver…</option>
                          {drivers.map((d) => (
                            <option key={d.driverId} value={d.driverId}>{d.name} — {d.vehicle}</option>
                          ))}
                        </select>
                        <button
                          className="whAssignBtn"
                          onClick={() => handleAssign(r._id)}
                          disabled={!selected[r._id] || assigning[r._id]}
                        >
                          {assigning[r._id] ? "…" : "Assign"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseAdmin;

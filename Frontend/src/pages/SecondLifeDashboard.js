import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/SecondLifeDashboard.css";

const DISPOSITION_META = {
  RESELL_LOCAL:      { label: "Resell Local",       color: "#059669", bg: "#dcfce7" },
  REFURBISH:         { label: "Refurbish",           color: "#d97706", bg: "#fef3c7" },
  RECYCLE:           { label: "Recycle",             color: "#7c3aed", bg: "#ede9fe" },
  RETURNLESS_REFUND: { label: "Returnless Refund",   color: "#2563eb", bg: "#dbeafe" },
  RETURN:            { label: "Standard Return",     color: "#0891b2", bg: "#cffafe" },
  DONATE:            { label: "Donate",              color: "#db2777", bg: "#fce7f3" },
  UNKNOWN:           { label: "Pending",             color: "#6b7280", bg: "#f3f4f6" },
};

const GRADE_COLORS = {
  "Like New": "#059669",
  Good:       "#2563eb",
  Fair:       "#d97706",
  Salvage:    "#dc2626",
};

// ── SVG Donut Chart ──────────────────────────────────────────
function SvgDonut({ segments, size = 180 }) {
  const r = 54;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cumulative = 0;
  // Start from top (−90°) → subtract quarter turn from offset
  const quarterTurn = circ / 4;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="20" />
      {segments.map((seg, i) => {
        const arc = total > 0 ? (seg.value / total) * circ : 0;
        const offset = circ - arc;
        const rotateDeg = (cumulative / circ) * 360 - 90;
        cumulative += arc;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="20"
            strokeDasharray={`${arc} ${offset}`}
            strokeDashoffset={quarterTurn}
            transform={`rotate(${rotateDeg} ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        );
      })}
      {/* Centre label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">
        RETURNS
      </text>
    </svg>
  );
}

// ── Sparkline (weekly trend) ─────────────────────────────────
function Sparkline({ data, width = 260, height = 60 }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const padX = 12;
  const padY = 8;
  const w = width - padX * 2;
  const h = height - padY * 2;
  const n = data.length;

  const pts = data.map((d, i) => {
    const x = padX + (i / (n - 1)) * w;
    const y = padY + h - (d.count / maxVal) * h;
    return [x, y];
  });

  const polyline = pts.map((p) => p.join(",")).join(" ");
  const area = [
    `${pts[0][0]},${padY + h}`,
    ...pts.map((p) => p.join(",")),
    `${pts[pts.length - 1][0]},${padY + h}`,
  ].join(" ");

  const minVal = Math.min(...data.map((d) => d.count));
  return (
    <svg width={width} height={height} className="dashSparkline">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y-axis max/min labels */}
      <text x={padX - 2} y={padY + 4} textAnchor="end" fontSize="9" fill="#6b7280" fontWeight="600">{maxVal}</text>
      <text x={padX - 2} y={padY + h} textAnchor="end" fontSize="9" fill="#6b7280" fontWeight="600">{minVal}</text>
      <polygon points={area} fill="url(#sparkGrad)" />
      <polyline points={polyline} fill="none" stroke="#059669" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#059669" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i][0]} y={padY + h + 14} textAnchor="middle" fontSize="9" fill="#9ca3af" fontWeight="600">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="dashStatCard">
      <div className="dashStatIcon" style={{ background: color + "20", color }}>
        {icon}
      </div>
      <div className="dashStatContent">
        <div className="dashStatValue">{value}</div>
        <div className="dashStatLabel">{label}</div>
        {sub && <div className="dashStatSub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Disposition bar row ──────────────────────────────────────
function DispositionBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="dashDispoRow">
      <div className="dashDispoLabel">
        <span className="dashDispoDot" style={{ background: color }} />
        {label}
      </div>
      <div className="dashDispoBarWrap">
        <div className="dashDispoBar">
          <div className="dashDispoFill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="dashDispoCount">{count}</span>
        <span className="dashDispoPct" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
const SecondLifeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const fetchData = useCallback(() => {
    axios.get(`${API_BASE_URL}/api/second-life/dashboard`)
      .then((res) => { setData(res.data); setLastRefresh(new Date()); })
      .catch((err) => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="dashPage">
        <div className="dashLoading"><div className="dashSpinner" /><p>Loading dashboard…</p></div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="dashPage">
        <div className="dashLoading">Failed to load dashboard data.</div>
      </div>
    );
  }

  const totalDispositions = Object.values(data.dispositionCounts).reduce((s, v) => s + v, 0);
  const liquidationValue = Math.round(data.totalRecoveryValue * 0.08);
  const recoverySaving = data.totalRecoveryValue - liquidationValue;
  const recoveryMultiple = liquidationValue > 0 ? Math.round(data.totalRecoveryValue / liquidationValue) : "∞";

  const donutSegments = Object.entries(data.dispositionCounts).map(([key, val]) => ({
    label: (DISPOSITION_META[key] || DISPOSITION_META.UNKNOWN).label,
    value: val,
    color: (DISPOSITION_META[key] || DISPOSITION_META.UNKNOWN).color,
  }));

  const totalGrades = Object.values(data.gradeBreakdown || {}).reduce((s, v) => s + v, 0);

  return (
    <div className="dashPage">
      {/* Header */}
      <div className="dashHeader">
        <div className="dashHeaderContent">
          <Link to="/second-life" className="dashBackLink">&#10094; Back to Marketplace</Link>
          <div className="dashHeaderRow">
            <div>
              <h1 className="dashTitle">♻️ Second Life Dashboard</h1>
              <p className="dashSubtitle">Real-time returns analytics, sustainability impact, and recovery value.</p>
            </div>
            <div className="dashLiveBadge" title="Auto-refreshes every 30s" style={{ cursor: "pointer" }} onClick={fetchData}>
              <span className="dashLiveDot" />
              Live · {lastRefresh ? lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Loading"}
            </div>
          </div>
        </div>
      </div>

      <div className="dashContent">
        {/* KPI row */}
        <div className="dashStatsGrid">
          <StatCard icon="📦" label="Returns Processed" value={data.totalReturns}
            sub="via Second Life engine" color="#059669" />
          <StatCard icon="🌱" label="CO₂ Saved"
            value={`${data.totalCarbonSaved} kg`}
            sub={`≈ ${Math.round(data.totalCarbonSaved / 21)} trees saved`}
            color="#065f46" />
          <StatCard icon="🚚" label="Logistics Cost Saved"
            value={`₹${data.totalLogisticsSaved.toLocaleString("en-IN")}`}
            sub="vs. traditional IHS store returns" color="#2563eb" />
          <StatCard icon="💰" label="Recovery Value"
            value={`₹${data.totalRecoveryValue.toLocaleString("en-IN")}`}
            sub={`${recoveryMultiple}× more than liquidation`} color="#d97706" />
        </div>

        {/* Row 2: Donut + Recovery vs Liquidation */}
        <div className="dashMiddleRow">
          {/* Disposition Donut */}
          <div className="dashSection">
            <h2 className="dashSectionTitle"><span className="dashSectionIcon">📊</span> Disposition Breakdown</h2>
            <p className="dashSectionDesc">How the AI engine routed {data.totalReturns} returns</p>
            <div className="dashDonutLayout">
              <SvgDonut segments={donutSegments} size={180} />
              <div className="dashDispoList">
                {Object.entries(data.dispositionCounts).map(([key, count]) => {
                  const meta = DISPOSITION_META[key] || DISPOSITION_META.UNKNOWN;
                  return (
                    <DispositionBar key={key} label={meta.label} count={count}
                      total={totalDispositions} color={meta.color} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recovery vs Liquidation */}
          <div className="dashSection">
            <h2 className="dashSectionTitle"><span className="dashSectionIcon">💎</span> Recovery vs Liquidation</h2>
            <p className="dashSectionDesc">Second Life recovers significantly more value per return</p>
            <div className="dashCompareCards">
              <div className="dashCompareCard dashCompareCard--win">
                <div className="dashCompareCardLabel">Second Life Recovery</div>
                <div className="dashCompareCardValue">₹{data.totalRecoveryValue.toLocaleString("en-IN")}</div>
                <div className="dashCompareCardSub">via resell + refurbish</div>
              </div>
              <div className="dashCompareCard dashCompareCard--loss">
                <div className="dashCompareCardLabel">Traditional Liquidation</div>
                <div className="dashCompareCardValue">₹{liquidationValue.toLocaleString("en-IN")}</div>
                <div className="dashCompareCardSub">~8% of item value</div>
              </div>
            </div>
            <div className="dashCompareGain">
              <span className="dashCompareGainBadge">
                🎯 {recoveryMultiple}× more value recovered via Second Life
              </span>
            </div>

            {/* ROI pitch line */}
            <div className="dashRoiNote">
              <div className="dashRoiLine">
                <span className="dashRoiIcon">🏭</span>
                <span>At scale: 1M returns → <b>₹{(data.totalRecoveryValue / data.totalReturns * 1000000 / 10000000).toFixed(0)} Cr</b> recovered</span>
              </div>
              <div className="dashRoiLine">
                <span className="dashRoiIcon">🌍</span>
                <span>Carbon at scale: <b>{Math.round(data.totalCarbonSaved / data.totalReturns * 1000000 / 1000)} tonnes CO₂</b> saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Weekly trend + Grade + Top Brands */}
        <div className="dashThirdRow">
          {/* Weekly sparkline */}
          <div className="dashSection dashSectionSmall">
            <h2 className="dashSectionTitle"><span className="dashSectionIcon">📈</span> Weekly Activity</h2>
            <p className="dashSectionDesc">Returns processed over the last 7 days</p>
            <Sparkline data={data.weeklyTrend} width={260} height={72} />
          </div>

          {/* Grade distribution */}
          <div className="dashSection dashSectionSmall">
            <h2 className="dashSectionTitle"><span className="dashSectionIcon">🏅</span> AI Grade Distribution</h2>
            <p className="dashSectionDesc">Condition of items entering the system</p>
            <div className="dashGradeList">
              {Object.entries(data.gradeBreakdown || {}).map(([grade, count]) => {
                const pct = totalGrades > 0 ? Math.round((count / totalGrades) * 100) : 0;
                const color = GRADE_COLORS[grade] || "#6b7280";
                return (
                  <div key={grade} className="dashGradeRow">
                    <span className="dashGradeLabel" style={{ color }}>{grade}</span>
                    <div className="dashGradeBarWrap">
                      <div className="dashGradeTrack">
                        <div className="dashGradeFill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="dashGradeCount">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top brands */}
          <div className="dashSection dashSectionSmall">
            <h2 className="dashSectionTitle"><span className="dashSectionIcon">🏷️</span> Top Brands</h2>
            <p className="dashSectionDesc">By return volume through Second Life</p>
            <div className="dashBrandList">
              {(data.topBrands || []).map((b, i) => (
                <div key={b.brand} className="dashBrandRow">
                  <span className="dashBrandRank">#{i + 1}</span>
                  <span className="dashBrandName">{b.brand}</span>
                  <span className="dashBrandCount">{b.count} items</span>
                  <span className="dashBrandCo2">🌱 {b.carbonSaved} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ESG summary bar */}
        <div className="dashEsgBar">
          <div className="dashEsgItem">
            <div className="dashEsgVal">🌿 {data.totalCarbonSaved} kg</div>
            <div className="dashEsgKey">Carbon Offset</div>
          </div>
          <div className="dashEsgDivider" />
          <div className="dashEsgItem">
            <div className="dashEsgVal">🏭 {data.totalReturns}</div>
            <div className="dashEsgKey">Items Diverted from Landfill</div>
          </div>
          <div className="dashEsgDivider" />
          <div className="dashEsgItem">
            <div className="dashEsgVal">💸 ₹{recoverySaving.toLocaleString("en-IN")}</div>
            <div className="dashEsgKey">Net Savings vs Liquidation</div>
          </div>
          <div className="dashEsgDivider" />
          <div className="dashEsgItem">
            <div className="dashEsgVal">🌱 {Math.round(data.totalCarbonSaved / 21)}</div>
            <div className="dashEsgKey">Equivalent Trees Saved</div>
          </div>
        </div>

        {/* Recent returns table */}
        <div className="dashSection dashSectionFull" style={{ marginTop: 20 }}>
          <h2 className="dashSectionTitle"><span className="dashSectionIcon">🕒</span> Recent Returns</h2>
          <p className="dashSectionDesc">Last {data.recentReturns.length} items processed by the AI engine</p>
          {data.recentReturns.length === 0 ? (
            <div className="dashEmpty">No returns yet.</div>
          ) : (
            <div className="dashTable">
              <div className="dashTableHeader">
                <div>Product</div>
                <div>Grade</div>
                <div>Disposition</div>
                <div>Recovery</div>
                <div>CO₂ Saved</div>
                <div>Date</div>
              </div>
              {data.recentReturns.map((r) => {
                const dispMeta = DISPOSITION_META[r.disposition] || DISPOSITION_META.UNKNOWN;
                return (
                  <Link key={r.id} to={r.id ? `/returns/tracking/${r.id}` : "#"} className="dashTableRow" style={{ textDecoration: "none", color: "inherit", display: "contents" }}>
                  <div className="dashTableRow dashTableRow--link">
                    <div className="dashTableProduct">
                      {r.productImage && (
                        <img src={r.productImage} alt={r.productName} className="dashTableImg" />
                      )}
                      <div>
                        <div className="dashTableName">{r.productName}</div>
                        <div className="dashTablePrice">₹{r.productPrice?.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                    <div>
                      <span className="dashGradeBadge" style={{ color: GRADE_COLORS[r.aiGrade] || "#374151" }}>
                        {r.aiGrade || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="dashDispoBadge" style={{ background: dispMeta.bg, color: dispMeta.color }}>
                        {dispMeta.label}
                      </span>
                    </div>
                    <div className="dashTableRecovery">₹{r.suggestedPrice?.toLocaleString("en-IN") || "—"}</div>
                    <div className="dashTableCo2">🌱 {r.carbonSaved} kg</div>
                    <div className="dashTableDate">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecondLifeDashboard;

import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import "../styles/Returns.css";



const GRADE_CONFIG = {
  "Like New": { color: "#16a34a", bg: "rgba(22,163,74,0.18)", border: "#16a34a" },
  "Good":     { color: "#2563eb", bg: "rgba(37,99,235,0.18)",  border: "#3b82f6" },
  "Fair":     { color: "#d97706", bg: "rgba(217,119,6,0.18)",  border: "#f59e0b" },
  "Salvage":  { color: "#dc2626", bg: "rgba(220,38,38,0.18)",  border: "#ef4444" },
};

const GRADE_DISCOUNT = { "Like New": 70, "Good": 55, "Fair": 40, "Salvage": 20 };

const BASE_CATEGORY_CREDITS = {
  Shoes: 20, Bags: 18, BottomWear: 15, Tshirt: 12, Caps: 10,
  Electronics: 30, Mobiles: 30, Laptops: 30, Furniture: 22, Books: 8,
};

function estCredits(category, carbonSaved, conditionScore) {
  const base      = BASE_CATEGORY_CREDITS[category] ?? 15;
  const kmAvoided = carbonSaved ? Math.round(carbonSaved / 0.15) : 80;
  return Math.round(base + kmAvoided * 0.05 + conditionScore * 0.1);
}

function GradeBadge({ grade }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG["Fair"];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 11px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.4,
      background: cfg.bg,
      color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
    }}>
      {grade}
    </span>
  );
}

function ConditionScoreBar({ score }) {
  const color = score >= 85 ? "#16a34a" : score >= 60 ? "#2563eb" : score >= 35 ? "#d97706" : "#dc2626";
  return (
    <div className="aiScoreBarRow">
      <div className="aiScoreBarWrap">
        <div className="aiScoreBarTrack">
          <div className="aiScoreBarFill" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
      <span className="aiScoreNum" style={{ color }}>{score}<span className="aiScoreOf">/100</span></span>
    </div>
  );
}

const AI_PHASES = [
  { icon: "📡", text: "Sending image to AI model…",        pct: 8  },
  { icon: "🔍", text: "Reading pixel-level details…",      pct: 20 },
  { icon: "🔬", text: "Scanning surface condition…",       pct: 35 },
  { icon: "🧪", text: "Detecting wear & damage…",          pct: 50 },
  { icon: "🎨", text: "Analysing colour & texture…",       pct: 63 },
  { icon: "📊", text: "Computing condition score…",        pct: 76 },
  { icon: "🤖", text: "AI evaluating return eligibility…", pct: 88 },
  { icon: "📝", text: "Generating inspection report…",     pct: 96 },
];

const Returns = () => {
  const [cartItems, setCartItems] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [selectedDisposition, setSelectedDisposition] = useState({});
  const [submitting, setSubmitting] = useState({});

  // AI Inspection state — keyed by productId
  const [uploadedImage, setUploadedImage] = useState({});
  const [imagePreview, setImagePreview] = useState({});
  const [videoPreview, setVideoPreview] = useState({});
  const [inspecting, setInspecting] = useState({});
  const [inspectPhase, setInspectPhase] = useState({});
  const [inspectionResult, setInspectionResult] = useState({});
  const [inspectionError, setInspectionError] = useState({});
  const [toast, setToast] = useState(null);

  const fileInputRefs = useRef({});
  const videoInputRefs = useRef({});
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  const DISPOSITION_CONFIG = {
    RETURN: {
      icon: "↩️",
      label: "Full Return & Refund",
      desc: "Ship the item back to the IHS Store for a complete refund.",
      colorClass: "disposition--return",
    },
    RESELL_LOCAL: {
      icon: "🌿",
      label: "List on Second Life",
      desc: "Resell on our sustainable marketplace and earn Green Credits.",
      colorClass: "disposition--resell",
    },
    RECYCLE: {
      icon: "♻️",
      label: "Eco Recycle",
      desc: "Send to a certified recycling centre and earn Green Credits.",
      colorClass: "disposition--recycle",
    },
  };

  useEffect(() => {
    if (!token) { navigate("/signin"); return; }

    const fetchCart = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Flatten all order items into a single list, deduplicated by productId
        // (keep the most-recently-ordered entry for each product)
        const seen = new Set();
        const items = [];
        for (const order of res.data) {
          for (const item of order.items) {
            const id = item.productId?.toString();
            if (!seen.has(id)) {
              seen.add(id);
              items.push({
                product: {
                  id:          item.productId,
                  name:        item.productName,
                  image:       item.productImage,
                  price:       item.productPrice,
                  brand:       item.productBrand,
                  description: "",
                },
                quantity: item.quantity,
                subtotal: item.subtotal,
              });
            }
          }
        }
        setCartItems(items);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingCart(false);
      }
    };

    const fetchReturns = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/returns`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReturnRequests(res.data);
      } catch (err) {
        console.error("Error fetching returns:", err);
      } finally {
        setLoadingReturns(false);
      }
    };

    fetchCart();
    fetchReturns();
  }, [API_BASE_URL, token, navigate]);

  const hasReturn = (productId) =>
    returnRequests.some((r) => r.productId?.toString() === productId?.toString());

  // ── Image Upload Handler ────────────────────────────────
  const handleImageChange = (productId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview((prev) => ({ ...prev, [productId]: reader.result }));
    };
    reader.readAsDataURL(file);
    setUploadedImage((prev) => ({ ...prev, [productId]: file }));
    setInspectionResult((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    setInspectionError((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    setSelectedDisposition((prev) => { const n = { ...prev }; delete n[productId]; return n; });
  };

  // ── Video Upload Handler (cosmetic — preview only) ──────
  const handleVideoChange = (productId, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoPreview((prev) => ({ ...prev, [productId]: url }));
  };

  // ── AI Inspection with phase animation ──────────────────
  const handleInspect = async (productId) => {
    const file = uploadedImage[productId];
    if (!file) {
      alert("Please upload a product image first.");
      return;
    }

    setInspecting((prev) => ({ ...prev, [productId]: true }));
    setInspectPhase((prev) => ({ ...prev, [productId]: 0 }));
    setInspectionError((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    setInspectionResult((prev) => { const n = { ...prev }; delete n[productId]; return n; });

    // Advance through phases while the real API call runs
    let phase = 0;
    const phaseInterval = setInterval(() => {
      phase = Math.min(phase + 1, AI_PHASES.length - 1);
      setInspectPhase((prev) => ({ ...prev, [productId]: phase }));
    }, 900);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await axios.post(
        `${API_BASE_URL}/returns/inspect`,
        { imageBase64: base64, mimeType: file.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearInterval(phaseInterval);
      // Hold at 100% briefly before revealing result
      setInspectPhase((prev) => ({ ...prev, [productId]: AI_PHASES.length - 1 }));
      await new Promise((r) => setTimeout(r, 600));
      setInspectionResult((prev) => ({ ...prev, [productId]: res.data }));
    } catch (err) {
      clearInterval(phaseInterval);
      const serverError = err.response?.data?.error;
      setInspectionError((prev) => ({
        ...prev,
        [productId]: serverError || err.message || "Failed to inspect. Please try again.",
      }));
    } finally {
      setInspecting((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // ── Submit Return ───────────────────────────────────────
  const handleReturnSubmit = async (item) => {
    const productId = item.product.id;
    if (!inspectionResult[productId]) {
      setToast({ msg: "Complete AI inspection before submitting your return.", type: "warning" });
      return;
    }
    const disposition = selectedDisposition[productId];
    if (!disposition) {
      setToast({ msg: "Please select a return option first.", type: "warning" });
      return;
    }
    const cfg = DISPOSITION_CONFIG[disposition];
    const reason = cfg ? cfg.label : disposition;
    const aiResult = inspectionResult[productId];

    // Confidence string → numeric score
    const confidenceMap = { High: 95, Medium: 70, Low: 40 };

    setSubmitting((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await axios.post(
        `${API_BASE_URL}/returns`,
        {
          productId,
          productName: item.product.name,
          productImage: item.product.image,
          productPrice: item.product.price,
          productBrand: item.product.brand || "",
          productCategory: item.product.brand || "General",
          quantity: item.quantity,
          reason,
          // AI passport fields from the inspection result
          aiGrade: aiResult?.grade || null,
          conditionScore: aiResult?.conditionScore ?? null,
          aiDisposition: disposition,
          detectedIssues: aiResult?.issues || [],
          carbonSaved: aiResult?.conditionScore != null
            ? Math.round(aiResult.conditionScore * 0.15 * 10) / 10
            : null,
          confidenceScore: confidenceMap[aiResult?.confidence] || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.dispatchEvent(new Event("greenCreditsUpdated"));
      const returnId = res.data.returnReq?._id;
      if (disposition === "RESELL_LOCAL") {
        const params = new URLSearchParams({
          fromReturn: "true",
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.image,
          productPrice: item.product.price,
          productBrand: item.product.brand || "",
        });
        navigate(`/second-life/sell?${params.toString()}`);
      } else {
        navigate(`/returns/tracking/${returnId}`);
      }
    } catch (err) {
      console.error("Error submitting return:", err);
      setToast({ msg: "Failed to submit return. Please try again.", type: "error" });
    } finally {
      setSubmitting((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const cls = { "In Process": "status-inprocess", Pending: "status-pending", Approved: "status-approved", Rejected: "status-rejected" };
    return <span className={`statusBadge ${cls[status] || "status-pending"}`}>{status}</span>;
  };

  const getDecisionBadge = (decision) => (
    <span className={`aiDecisionBadge ${decision === "RETURN" ? "ai-return" : "ai-resell"}`}>
      {decision === "RETURN" ? "⛔ RETURN" : "✅ RESELL"}
    </span>
  );

  const getConfidenceBar = (confidence) => {
    const w = confidence === "High" ? "100%" : confidence === "Medium" ? "65%" : "35%";
    const color = confidence === "High" ? "#16a34a" : confidence === "Medium" ? "#d97706" : "#dc2626";
    return (
      <div className="confidenceBar">
        <span className="confidenceLabel">Confidence: {confidence}</span>
        <div className="confidenceTrack"><div className="confidenceFill" style={{ width: w, background: color }} /></div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="returnsPage">
      {/* Header */}
      <div className="returnsHeader">
        <Link to="/" className="returnsBackLink">&#10094; Back to Home</Link>
        <h1 className="returnsTitle">Returns Centre</h1>
        <p className="returnsSubtitle">Upload a photo of your item — our AI will instantly inspect it and decide whether it qualifies for a return.</p>
      </div>

      {/* Purchased Items */}
      <div className="returnsSection">
        <h2 className="sectionHeading"><span className="sectionIcon">🛍️</span> Your Purchased Items</h2>
        <p className="sectionDesc">Upload a product image → let AI inspect it → select a reason → submit your return.</p>

        {loadingCart ? (
          <div className="returnsLoading">Loading your items...</div>
        ) : cartItems.length === 0 ? (
          <div className="returnsEmpty">
            <div className="emptyIcon">📭</div>
            <p>No purchased items found. Buy something first!</p>
            <Link to="/" className="shopNowBtn">Shop Now</Link>
          </div>
        ) : (
          <div className="returnItemsList">
            {cartItems.map((item) => {
              const productId = item.product.id;
              const alreadyReturned = hasReturn(productId);
              const result = inspectionResult[productId];
              const error = inspectionError[productId];
              const isInspecting = inspecting[productId];
              const preview = imagePreview[productId];

              return (
                <div key={productId} className={`returnItemCard ${alreadyReturned ? "returnItemCard--returned" : ""}`}>
                  {/* Product image — direct flex child so flex-shrink:0 takes effect */}
                  <img src={item.product.image} alt={item.product.name} className="returnItemImg" />

                  {/* Details + AI section */}
                  <div className="returnItemDetails">
                    <div className="returnItemBrand">{item.product.brand}</div>
                    <div className="returnItemName">{item.product.name}</div>
                    <div className="returnItemMeta">
                      <span>Qty: {item.quantity}</span>
                      <span className="separator">|</span>
                      <span>₹{item.product.price} each</span>
                      <span className="separator">|</span>
                      <span className="returnItemSubtotal">Total: ₹{item.subtotal}</span>
                    </div>

                    {alreadyReturned ? (
                      <div className="returnAlreadySubmitted">✅ Return already requested</div>
                    ) : (
                      <>
                        {/* ── Step Progress Bar ── */}
                        <div className="returnSteps">
                          {[
                            { n: 1, label: "Upload Photo",   done: !!preview,  active: !preview },
                            { n: 2, label: "AI Inspection",  done: !!result,   active: !!preview && !result },
                            { n: 3, label: "Choose Option",  done: !!selectedDisposition[productId], active: !!result && !selectedDisposition[productId] },
                            { n: 4, label: "Confirm",        done: false,       active: !!selectedDisposition[productId] },
                          ].map((step, idx, arr) => (
                            <React.Fragment key={step.n}>
                              <div className={`returnStep ${step.done ? "returnStep--done" : step.active ? "returnStep--active" : "returnStep--idle"}`}>
                                <div className="returnStepCircle">
                                  {step.done ? "✓" : step.n}
                                </div>
                                <span className="returnStepLabel">{step.label}</span>
                              </div>
                              {idx < arr.length - 1 && (
                                <div className={`returnStepLine ${step.done ? "returnStepLine--done" : ""}`} />
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* ── Step 1 + 2: Upload & Inspect ── */}
                        <div className="aiInspectionBlock">
                          {!result && (
                            <div className="aiBlockTitle">
                              <span className="aiSparkle">✨</span>
                              {preview ? "Step 2 — Run AI Inspection" : "Step 1 — Upload a Photo of Your Item"}
                            </div>
                          )}
                          {result && (
                            <div className="aiBlockTitle aiBlockTitle--done">
                              <span className="aiSparkle">✅</span> AI Inspection Complete
                              <button
                                className="reInspectLink"
                                onClick={() => {
                                  setInspectionResult((p) => { const n={...p}; delete n[productId]; return n; });
                                  setSelectedDisposition((p) => { const n={...p}; delete n[productId]; return n; });
                                  setImagePreview((p) => { const n={...p}; delete n[productId]; return n; });
                                  setUploadedImage((p) => { const n={...p}; delete n[productId]; return n; });
                                  setVideoPreview((p) => { const n={...p}; delete n[productId]; return n; });
                                }}
                              >
                                Re-inspect
                              </button>
                            </div>
                          )}

                          {!result && (
                            <p className="aiBlockDesc">
                              {preview
                                ? "Photo uploaded. Click Inspect to let AI grade your item and determine return options."
                                : "Upload a clear photo of your product. AI inspection is required before you can submit a return."}
                            </p>
                          )}

                          {/* Upload area — hidden once result is in */}
                          {!result && (
                            <>
                              <div className="uploadDualRow">
                                {/* Photo upload */}
                                <div className="uploadCol">
                                  <div className="uploadColLabel">
                                    <span>📸</span> Product Photo <span className="uploadRequired">required</span>
                                  </div>
                                  <div
                                    className={`uploadArea uploadArea--photo ${preview ? "uploadArea--filled" : ""}`}
                                    onClick={() => fileInputRefs.current[productId]?.click()}
                                  >
                                    {preview ? (
                                      <>
                                        <img src={preview} alt="Uploaded product" className="uploadedPreview" />
                                        <div className="uploadFilledBadge">✓ Photo ready</div>
                                      </>
                                    ) : (
                                      <div className="uploadPlaceholder">
                                        <span className="uploadIcon">📸</span>
                                        <span>Click to upload</span>
                                        <span className="uploadHint">JPG, PNG, WEBP</span>
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    ref={(el) => (fileInputRefs.current[productId] = el)}
                                    onChange={(e) => handleImageChange(productId, e.target.files[0])}
                                  />
                                </div>

                                {/* Video upload (cosmetic) */}
                                <div className="uploadCol">
                                  <div className="uploadColLabel">
                                    <span>🎥</span> Product Video <span className="uploadOptional">optional</span>
                                  </div>
                                  <div
                                    className={`uploadArea uploadArea--video ${videoPreview[productId] ? "uploadArea--filled" : ""}`}
                                    onClick={() => videoInputRefs.current[productId]?.click()}
                                  >
                                    {videoPreview[productId] ? (
                                      <>
                                        <video
                                          src={videoPreview[productId]}
                                          className="uploadedPreview"
                                          muted
                                          loop
                                          autoPlay
                                          playsInline
                                        />
                                        <div className="uploadFilledBadge uploadFilledBadge--video">✓ Video ready</div>
                                      </>
                                    ) : (
                                      <div className="uploadPlaceholder">
                                        <span className="uploadIcon">🎥</span>
                                        <span>Click to upload</span>
                                        <span className="uploadHint">MP4, MOV · 5–15 sec</span>
                                      </div>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    style={{ display: "none" }}
                                    ref={(el) => (videoInputRefs.current[productId] = el)}
                                    onChange={(e) => handleVideoChange(productId, e.target.files[0])}
                                  />
                                </div>
                              </div>

                              {videoPreview[productId] && (
                                <div className="uploadVideoNote">
                                  <span>⚡</span> Video will be analyzed for motion-based wear detection
                                </div>
                              )}
                            </>
                          )}

                          {/* Inspect button — only when photo uploaded, no result yet */}
                          {!result && (
                            <button
                              className={`inspectBtn ${preview && !isInspecting ? "inspectBtn--ready" : ""}`}
                              onClick={() => handleInspect(productId)}
                              disabled={isInspecting || !uploadedImage[productId]}
                            >
                              {isInspecting ? (
                                <span className="inspectLoader">
                                  <span className="spinnerDot" /><span className="spinnerDot" /><span className="spinnerDot" />
                                  Analyzing image…
                                </span>
                              ) : preview ? (
                                "🔍 Inspect with AI →"
                              ) : (
                                "Upload a photo first"
                              )}
                            </button>
                          )}

                          {/* Phase-driven AI processing overlay */}
                          {isInspecting && (() => {
                            const phase = inspectPhase[productId] ?? 0;
                            const phaseDef = AI_PHASES[phase];
                            const pct = phaseDef?.pct ?? 10;
                            return (
                              <div className="aiProcessingOverlay">
                                {/* Media previews side by side */}
                                <div className="aiScanRow">
                                  <div className="aiScanMedia">
                                    <div className="aiScanBar" />
                                    <img src={preview} alt="Scanning" className="aiScanImg" />
                                    <div className="aiScanCorner aiScanCorner--tl" />
                                    <div className="aiScanCorner aiScanCorner--tr" />
                                    <div className="aiScanCorner aiScanCorner--bl" />
                                    <div className="aiScanCorner aiScanCorner--br" />
                                  </div>
                                  {videoPreview[productId] && (
                                    <div className="aiScanMedia">
                                      <div className="aiScanBar aiScanBar--blue" />
                                      <video
                                        src={videoPreview[productId]}
                                        className="aiScanImg"
                                        muted autoPlay loop playsInline
                                      />
                                      <div className="aiScanVideoLabel">Video Analysis</div>
                                    </div>
                                  )}
                                </div>

                                {/* Phase steps */}
                                <div className="aiPhaseList">
                                  {AI_PHASES.map((p, i) => (
                                    <div
                                      key={i}
                                      className={`aiPhaseItem ${
                                        i < phase ? "aiPhaseItem--done" :
                                        i === phase ? "aiPhaseItem--active" : "aiPhaseItem--idle"
                                      }`}
                                    >
                                      <span className="aiPhaseIcon">
                                        {i < phase ? "✓" : i === phase ? p.icon : "○"}
                                      </span>
                                      <span className="aiPhaseText">{p.text}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Progress bar */}
                                <div className="aiProgressWrap">
                                  <div className="aiProgressTrack">
                                    <div
                                      className="aiProgressFill"
                                      style={{ width: `${pct}%`, transition: "width 0.8s ease" }}
                                    />
                                  </div>
                                  <span className="aiProgressPct">{pct}%</span>
                                </div>
                                <div className="aiProcessingLabel">{phaseDef?.text}</div>
                              </div>
                            );
                          })()}

                          {/* Error */}
                          {error && (
                            <div className="inspectionError">
                              ⚠️ {error}
                            </div>
                          )}

                          {/* Result */}
                          {result && (
                            <div className={`aiResultCard ${result.decision === "RETURN" ? "aiResult--return" : "aiResult--resell"}`}>
                              <div className="aiResultHeader">
                                <span className="aiResultTitle">AI Inspection Result</span>
                                <div className="aiResultBadges">
                                  {result.grade && <GradeBadge grade={result.grade} />}
                                  {getDecisionBadge(result.decision)}
                                  <span className="aiSourceBadge aiSourceBadge--gemini">✨ AI Powered</span>
                                </div>
                              </div>

                              {result.conditionScore != null && (
                                <div className="aiScoreSection">
                                  <div className="aiScoreLabel">Condition Score</div>
                                  <ConditionScoreBar score={result.conditionScore} />
                                </div>
                              )}

                              {getConfidenceBar(result.confidence)}

                              <div className="aiResultCondition">
                                Condition: <b>{result.condition}</b>
                              </div>
                              <div className="aiResultReasoning">
                                <b>Reasoning:</b> {result.reasoning}
                              </div>

                              {result.issues && result.issues.length > 0 && (
                                <div className="aiResultIssues">
                                  <b>Observed Issues:</b>
                                  <ul>
                                    {result.issues.map((issue, i) => (
                                      <li key={i}>• {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {result.grade && result.availableDispositions?.includes("RESELL_LOCAL") && (
                                <div className="aiPassportMetrics">
                                  <div className="aiMetricChip aiMetricChip--green">
                                    <span>♻️</span>
                                    <span>~{Math.round(result.conditionScore * 0.15 * 10) / 10} kg CO₂ saved</span>
                                  </div>
                                  <div className="aiMetricChip aiMetricChip--blue">
                                    <span>🌿</span>
                                    <span>Resale at ~{GRADE_DISCOUNT[result.grade] || 55}% of original</span>
                                  </div>
                                  <div className="aiMetricChip aiMetricChip--gold">
                                    <span>⭐</span>
                                    <span>
                                      ~{estCredits(
                                        item.product.brand,
                                        Math.round(result.conditionScore * 0.15 * 10) / 10,
                                        result.conditionScore
                                      )} Green Credits if listed
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── Step 3 + 4: Choose Option & Submit (only after inspection) ── */}
                        {result && result.availableDispositions ? (
                          <div className="dispositionOptionsBlock">
                            <div className="dispositionOptionsTitle">
                              Step 3 — Choose your return option
                            </div>
                            {result.decision && (
                              <div className="aiRecommendBanner">
                                <span className="aiRecommendIcon">🤖</span>
                                AI recommends: <b>{DISPOSITION_CONFIG[
                                  result.decision === "RETURN" ? "RETURN"
                                  : result.decision === "RESELL" ? "RESELL_LOCAL"
                                  : "RECYCLE"
                                ]?.label || result.decision}</b>
                                <span className="aiRecommendSub"> — but the choice is yours</span>
                              </div>
                            )}
                            <div className="dispositionOptionCards">
                              {result.availableDispositions.map((key) => {
                                const cfg = DISPOSITION_CONFIG[key];
                                if (!cfg) return null;
                                const isSelected = selectedDisposition[productId] === key;
                                const aiRecommended =
                                  (result.decision === "RETURN" && key === "RETURN") ||
                                  (result.decision === "RESELL" && key === "RESELL_LOCAL") ||
                                  (result.decision === "RECYCLE" && key === "RECYCLE");
                                const creditsMap = { RETURN: 20, RESELL_LOCAL: 25, RECYCLE: 15 };
                                const creditsEarned = creditsMap[key] ?? 10;
                                return (
                                  <button
                                    key={key}
                                    className={`dispositionOptionCard ${cfg.colorClass} ${isSelected ? "dispositionOptionCard--selected" : ""} ${aiRecommended ? "dispositionOptionCard--recommended" : ""}`}
                                    onClick={() =>
                                      setSelectedDisposition((prev) => ({ ...prev, [productId]: key }))
                                    }
                                  >
                                    {aiRecommended && (
                                      <span className="dispositionAITag">⭐ AI Pick</span>
                                    )}
                                    <span className="dispositionIcon">{cfg.icon}</span>
                                    <span className="dispositionLabel">{cfg.label}</span>
                                    <span className="dispositionDesc">{cfg.desc}</span>
                                    <span className="dispositionCreditsHint">🌿 +{creditsEarned} Green Credits</span>
                                    {isSelected && <span className="dispositionCheck">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              className="returnSubmitBtn"
                              onClick={() => handleReturnSubmit(item)}
                              disabled={submitting[productId] || !selectedDisposition[productId]}
                            >
                              {submitting[productId] ? "Submitting…" : "✅ Confirm Return"}
                            </button>
                          </div>
                        ) : result && (
                          <div className="inspectionError">
                            ⚠️ Could not determine return options. Please re-inspect the item.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return History */}
      <div className="returnsSection returnsHistorySection">
        <h2 className="sectionHeading"><span className="sectionIcon">📋</span> Your Return Requests</h2>
        <p className="sectionDesc">Track the status of your submitted return requests below.</p>

        {loadingReturns ? (
          <div className="returnsLoading">Loading return history...</div>
        ) : returnRequests.length === 0 ? (
          <div className="returnsEmpty">
            <div className="emptyIcon">📝</div>
            <p>No return requests yet.</p>
          </div>
        ) : (
          <div className="returnHistoryList">
            {[...returnRequests].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)).map((req) => (
              <div key={req._id} className="returnHistoryCardWrapper">
                <Link to={`/returns/tracking/${req._id}`} className="returnHistoryCardLink">
                  <div className="returnHistoryCard">
                    <img src={req.productImage} alt={req.productName} className="returnHistoryImg" />
                    <div className="returnHistoryDetails">
                      <div className="returnHistoryName">{req.productName}</div>
                      <div className="returnHistoryMeta">
                        <span>Qty: {req.quantity}</span>
                        <span className="separator">|</span>
                        <span>₹{req.productPrice}</span>
                        {req.aiGrade && (
                          <>
                            <span className="separator">|</span>
                            <span className={`rh-grade-chip rh-grade--${req.aiGrade.replace(" ", "-").toLowerCase()}`}>{req.aiGrade}</span>
                          </>
                        )}
                      </div>
                      <div className="returnHistoryReason">Reason: <b>{req.reason}</b></div>
                      <div className="returnHistoryDate">
                        Requested on:{" "}
                        {new Date(req.requestedAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="returnHistoryStatus">
                      {getStatusBadge(req.status)}
                      <span className="returnHistoryChevron">›</span>
                    </div>
                  </div>
                </Link>
                {req.productId && (
                  <Link
                    to={`/passport/${req.productId}`}
                    className="rh-passport-btn"
                  >
                    🛂 View Product Passport
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default Returns;

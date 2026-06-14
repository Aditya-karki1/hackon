import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../styles/SellOnSecondLife.css";

const GRADE_COLORS = {
  "Like New": { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  Good: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  Fair: { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  Salvage: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

function SellStepBar({ preview, graded, listed }) {
  const steps = [
    { n: 1, label: "Upload Photo", done: !!preview, active: !preview },
    { n: 2, label: "AI Grade",    done: !!graded,  active: !!preview && !graded },
    { n: 3, label: "List Item",   done: !!listed,  active: !!graded && !listed },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18, marginTop: 4 }}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.n}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13,
              background: step.done ? "#059669" : step.active ? "#065f46" : "#e5e7eb",
              color: step.done || step.active ? "#fff" : "#9ca3af",
              border: step.active ? "2.5px solid #6ee7b7" : "2.5px solid transparent",
              transition: "all 0.3s",
            }}>
              {step.done ? "✓" : step.n}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
              color: step.done ? "#059669" : step.active ? "#d1fae5" : "#9ca3af",
            }}>{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div style={{
              flex: 1, height: 3, marginBottom: 18,
              background: steps[idx].done ? "#059669" : "#e5e7eb",
              transition: "background 0.3s",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function GradeBadge({ grade }) {
  const c = GRADE_COLORS[grade] || GRADE_COLORS["Good"];
  return (
    <span
      className="sellGradeBadge"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {grade}
    </span>
  );
}

const SellOnSecondLife = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});
  const [gradeResult, setGradeResult] = useState({});
  const [listing, setListing] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [listed, setListed] = useState({});
  const [uploadedImage, setUploadedImage] = useState({});
  const [imagePreview, setImagePreview] = useState({});
  const fileInputRefs = useRef({});
  const [searchParams] = useSearchParams();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Product pre-filled from a return (RESELL_LOCAL disposition)
  const fromReturn = searchParams.get("fromReturn") === "true";
  const returnedProduct = fromReturn
    ? {
        id: searchParams.get("productId"),
        name: searchParams.get("productName"),
        image: searchParams.get("productImage"),
        price: parseFloat(searchParams.get("productPrice")) || 0,
        brand: searchParams.get("productBrand") || "",
      }
    : null;

  useEffect(() => {
    if (!token) { navigate("/signin"); return; }
    if (fromReturn) { setLoading(false); return; }
    axios
      .get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Flatten orders → unique items, same shape as cart
        const seen = new Set();
        const items = [];
        for (const order of res.data) {
          for (const item of order.items) {
            const id = item.productId?.toString();
            if (!seen.has(id)) {
              seen.add(id);
              items.push({
                product: {
                  id:    item.productId,
                  name:  item.productName,
                  image: item.productImage,
                  price: item.productPrice,
                  brand: item.productBrand,
                },
                quantity: item.quantity,
                subtotal: item.subtotal,
              });
            }
          }
        }
        setCartItems(items);
      })
      .catch((err) => console.error("Orders fetch error:", err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL, token, navigate, fromReturn]);

  const handleImageChange = (productId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setImagePreview((p) => ({ ...p, [productId]: reader.result }));
    reader.readAsDataURL(file);
    setUploadedImage((p) => ({ ...p, [productId]: file }));
    setGradeResult((p) => { const n = { ...p }; delete n[productId]; return n; });
  };

  // Mock AI grading — 2.5s artificial delay so it feels like real inference
  const handleGrade = async (productId, reason) => {
    if (!uploadedImage[productId]) {
      alert("Please upload a photo of your item first.");
      return;
    }
    setGrading((p) => ({ ...p, [productId]: true }));
    try {
      // Artificial AI inference delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Call backend grade-and-list endpoint (also returns mock grade)
      // We'll use the p2p endpoint which internally calls mockGradeProduct
      // For preview, we can compute it locally using the same rules
      const r = (reason || "").toLowerCase();
      const isDefective = r.includes("defect") || r.includes("damage");
      let grade, conditionScore, detectedIssues;

      if (isDefective) {
        conditionScore = 22 + Math.floor(Math.random() * 22);
        grade = conditionScore < 32 ? "Salvage" : "Fair";
        detectedIssues = ["Visible physical damage", "Functional issues detected"];
      } else {
        conditionScore = 72 + Math.floor(Math.random() * 23);
        grade = conditionScore > 88 ? "Like New" : "Good";
        detectedIssues = [];
      }

      const DISCOUNT = { "Like New": 0.70, "Good": 0.55, "Fair": 0.40, "Salvage": 0.20 };
      const cartItem = cartItems.find((i) => i.product.id.toString() === productId.toString());
      const originalPrice = cartItem?.product?.price || returnedProduct?.price || 0;
      const suggestedPrice = Math.round(originalPrice * (DISCOUNT[grade] || 0.50));

      setGradeResult((p) => ({
        ...p,
        [productId]: { grade, conditionScore, detectedIssues, suggestedPrice, originalPrice },
      }));
    } finally {
      setGrading((p) => ({ ...p, [productId]: false }));
    }
  };

  const handleList = async (item) => {
    const productId = item.id || item.product?.id;
    const prod = item.product || item;
    const result = gradeResult[productId];
    if (!result) return;

    setSubmitting((p) => ({ ...p, [productId]: true }));
    try {
      await axios.post(
        `${API_BASE_URL}/api/second-life/p2p`,
        {
          productId,
          productName: prod.name,
          productBrand: prod.brand,
          productImage: prod.image,
          originalPrice: prod.price,
          reason: listing[productId]?.reason || "Return — Resell",
          sellerLocation: listing[productId]?.location || "Your City",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setListed((p) => ({ ...p, [productId]: true }));
      const credits = parseInt(localStorage.getItem("greenCredits") || "0") + 25;
      localStorage.setItem("greenCredits", credits);
      window.dispatchEvent(new Event("greenCreditsUpdated"));
    } catch (err) {
      alert("Failed to list item. Please try again.");
    } finally {
      setSubmitting((p) => ({ ...p, [productId]: false }));
    }
  };

  return (
    <div className="sellPage">
      {/* Header */}
      <div className="sellHeader">
        <Link to="/second-life" className="sellBackLink">&#10094; Back to Marketplace</Link>
        <h1 className="sellTitle">💚 Sell on Second Life</h1>
        <p className="sellSubtitle">
          Upload a photo of your item — AI grades it in seconds and suggests a fair price. List it on the marketplace and earn Green Credits.
        </p>
        <div className="sellTrustRow">
          <span className="sellTrustBadge">🤖 AI Quality Grading</span>
          <span className="sellTrustBadge">🌱 +25 Green Credits per listing</span>
          <span className="sellTrustBadge">✅ Amazon Verified Badge</span>
        </div>
      </div>

      {/* Items */}
      <div className="sellContent">
        {/* ── Returned product pre-fill (from RESELL_LOCAL return) ── */}
        {fromReturn && returnedProduct && (
          <div className="sellReturnBanner">
            <span className="sellReturnBannerIcon">♻️</span>
            <div>
              <b>Return approved as Resell</b> — your item is ready to list on Second Life. Upload a photo and AI will grade it instantly.
            </div>
          </div>
        )}

        {loading ? (
          <div className="sellLoading">
            <div className="sellSpinner" />
            <p>Loading your items…</p>
          </div>
        ) : fromReturn && returnedProduct ? (
          // Show only the returned product
          <div className="sellItemsList">
            {(() => {
              const productId = returnedProduct.id;
              const result = gradeResult[productId];
              const isGrading = grading[productId];
              const isListed = listed[productId];
              const preview = imagePreview[productId];
              const isSubmitting = submitting[productId];

              return (
                <div key={productId} className={`sellCard ${isListed ? "sellCard--listed" : ""}`}>
                  <div className="sellCardLeft">
                    <img src={returnedProduct.image} alt={returnedProduct.name} className="sellCardImg" />
                  </div>
                  <div className="sellCardRight">
                    <div className="sellCardBrand">{returnedProduct.brand}</div>
                    <div className="sellCardName">{returnedProduct.name}</div>
                    <div className="sellCardMeta">
                      <span>₹{returnedProduct.price?.toLocaleString("en-IN")}</span>
                      <span className="separator">|</span>
                      <span className="sellReturnedTag">🔄 Returned item</span>
                    </div>
                    <SellStepBar preview={preview} graded={!!result} listed={isListed} />

                    {isListed ? (
                      <div className="sellListedMsg">
                        🎉 Listed on Second Life! You earned <b>+25 Green Credits</b>.
                        <Link to="/second-life" className="sellViewLink">View Marketplace →</Link>
                      </div>
                    ) : (
                      <>
                        <div className="sellFormRow">
                          <select
                            className="sellSelect"
                            defaultValue="Return — Resell"
                            onChange={(e) =>
                              setListing((p) => ({ ...p, [productId]: { ...p[productId], reason: e.target.value } }))
                            }
                          >
                            <option value="Return — Resell">Return — Resell</option>
                            <option value="Changed mind">Changed mind</option>
                            <option value="didn't fit">Doesn't fit</option>
                            <option value="No longer needed">No longer needed</option>
                          </select>
                          <input
                            className="sellInput"
                            placeholder="Your city (e.g. Mumbai)"
                            value={listing[productId]?.location || ""}
                            onChange={(e) =>
                              setListing((p) => ({ ...p, [productId]: { ...p[productId], location: e.target.value } }))
                            }
                          />
                        </div>

                        <div className="sellUploadBlock">
                          <div className="sellUploadTitle"><span>📸</span> Upload Item Photo</div>
                          <div className="sellUploadArea" onClick={() => fileInputRefs.current[productId]?.click()}>
                            {preview ? (
                              <img src={preview} alt="Preview" className="sellUploadPreview" />
                            ) : (
                              <div className="sellUploadPlaceholder">
                                <span className="sellUploadIcon">📷</span>
                                <span>Click to upload a clear photo</span>
                                <span className="sellUploadHint">JPG, PNG, WEBP supported</span>
                              </div>
                            )}
                          </div>
                          <input
                            type="file" accept="image/*" style={{ display: "none" }}
                            ref={(el) => (fileInputRefs.current[productId] = el)}
                            onChange={(e) => handleImageChange(productId, e.target.files[0])}
                          />
                        </div>

                        <button
                          className="sellGradeBtn"
                          disabled={isGrading || !uploadedImage[productId]}
                          onClick={() => handleGrade(productId, listing[productId]?.reason || "")}
                        >
                          {isGrading ? (
                            <span className="sellGradeLoader">
                              <span className="sellDot" /><span className="sellDot" /><span className="sellDot" />
                              AI is analyzing your photo…
                            </span>
                          ) : "🤖 Grade with AI"}
                        </button>

                        {isGrading && preview && (
                          <div className="sellGradingOverlay">
                            <div className="sellScanWrap">
                              <img src={preview} alt="Scanning" className="sellScanImg" />
                              <div className="sellScanBar" />
                            </div>
                            <p className="sellScanText">Running AI quality assessment…</p>
                          </div>
                        )}

                        {result && (
                          <div className="sellGradeResult">
                            <div className="sellGradeResultHeader">
                              <span className="sellGradeResultTitle">AI Grading Result</span>
                              <GradeBadge grade={result.grade} />
                            </div>
                            <div className="sellGradeScore">
                              <span className="sellGradeScoreLabel">Condition Score</span>
                              <div className="sellGradeScoreBar">
                                <div className="sellGradeScoreFill" style={{ width: `${result.conditionScore}%`, background: result.conditionScore >= 80 ? "#16a34a" : result.conditionScore >= 60 ? "#2563eb" : result.conditionScore >= 40 ? "#d97706" : "#dc2626" }} />
                              </div>
                              <span className="sellGradeScoreNum">{result.conditionScore}/100</span>
                            </div>
                            <div className="sellPriceBox">
                              <div className="sellPriceRow">
                                <span className="sellPriceLabel">Original Price</span>
                                <span className="sellPriceOrig">₹{result.originalPrice?.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="sellPriceRow">
                                <span className="sellPriceLabel">AI Suggested Price</span>
                                <span className="sellPriceSuggested">₹{result.suggestedPrice?.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="sellCreditsEarn">🌱 You'll earn <b>+25 Green Credits</b> when listed</div>
                            </div>
                            <button className="sellListBtn" onClick={() => handleList(returnedProduct)} disabled={isSubmitting}>
                              {isSubmitting ? "Listing…" : "✅ List on Second Life"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="sellEmpty">
            <div className="sellEmptyIcon">🛍️</div>
            <p>No purchased items found. Buy something first, then list it here!</p>
            <Link to="/" className="sellShopBtn">Shop Now</Link>
          </div>
        ) : (
          <div className="sellItemsList">
            {cartItems.map((item) => {
              const productId = item.product.id;
              const result = gradeResult[productId];
              const isGrading = grading[productId];
              const isListed = listed[productId];
              const preview = imagePreview[productId];
              const isSubmitting = submitting[productId];

              return (
                <div key={productId} className={`sellCard ${isListed ? "sellCard--listed" : ""}`}>
                  {/* Product info */}
                  <div className="sellCardLeft">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="sellCardImg"
                    />
                  </div>

                  <div className="sellCardRight">
                    <div className="sellCardBrand">{item.product.brand}</div>
                    <div className="sellCardName">{item.product.name}</div>
                    <div className="sellCardMeta">
                      <span>Qty: {item.quantity}</span>
                      <span className="separator">|</span>
                      <span>₹{item.product.price?.toLocaleString("en-IN")}</span>
                    </div>
                    <SellStepBar preview={preview} graded={!!result} listed={isListed} />

                    {isListed ? (
                      <div className="sellListedMsg">
                        🎉 Listed on Second Life! You earned <b>+25 Green Credits</b>.
                        <Link to="/second-life" className="sellViewLink">View Marketplace →</Link>
                      </div>
                    ) : (
                      <>
                        {/* Location + reason inputs */}
                        <div className="sellFormRow">
                          <select
                            className="sellSelect"
                            value={listing[productId]?.reason || ""}
                            onChange={(e) =>
                              setListing((p) => ({
                                ...p,
                                [productId]: { ...p[productId], reason: e.target.value },
                              }))
                            }
                          >
                            <option value="">Why are you selling?</option>
                            <option value="Changed mind">Changed mind</option>
                            <option value="didn't fit">Doesn't fit anymore</option>
                            <option value="Upgraded to newer model">Upgraded to newer model</option>
                            <option value="Received as duplicate gift">Received as duplicate gift</option>
                            <option value="No longer needed">No longer needed</option>
                          </select>
                          <input
                            className="sellInput"
                            placeholder="Your city (e.g. Mumbai)"
                            value={listing[productId]?.location || ""}
                            onChange={(e) =>
                              setListing((p) => ({
                                ...p,
                                [productId]: { ...p[productId], location: e.target.value },
                              }))
                            }
                          />
                        </div>

                        {/* Photo upload */}
                        <div className="sellUploadBlock">
                          <div className="sellUploadTitle">
                            <span>📸</span> Upload Item Photo
                          </div>
                          <div
                            className="sellUploadArea"
                            onClick={() => fileInputRefs.current[productId]?.click()}
                          >
                            {preview ? (
                              <img src={preview} alt="Preview" className="sellUploadPreview" />
                            ) : (
                              <div className="sellUploadPlaceholder">
                                <span className="sellUploadIcon">📷</span>
                                <span>Click to upload a clear photo</span>
                                <span className="sellUploadHint">JPG, PNG, WEBP supported</span>
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

                        {/* Grade button */}
                        <button
                          className="sellGradeBtn"
                          disabled={isGrading || !uploadedImage[productId]}
                          onClick={() =>
                            handleGrade(productId, listing[productId]?.reason || "")
                          }
                        >
                          {isGrading ? (
                            <span className="sellGradeLoader">
                              <span className="sellDot" />
                              <span className="sellDot" />
                              <span className="sellDot" />
                              AI is analyzing your photo…
                            </span>
                          ) : (
                            "🤖 Grade with AI"
                          )}
                        </button>

                        {/* AI grading animation */}
                        {isGrading && preview && (
                          <div className="sellGradingOverlay">
                            <div className="sellScanWrap">
                              <img src={preview} alt="Scanning" className="sellScanImg" />
                              <div className="sellScanBar" />
                            </div>
                            <p className="sellScanText">Running AI quality assessment…</p>
                          </div>
                        )}

                        {/* Grade result */}
                        {result && (
                          <div className="sellGradeResult">
                            <div className="sellGradeResultHeader">
                              <span className="sellGradeResultTitle">AI Grading Result</span>
                              <GradeBadge grade={result.grade} />
                            </div>

                            <div className="sellGradeScore">
                              <span className="sellGradeScoreLabel">Condition Score</span>
                              <div className="sellGradeScoreBar">
                                <div
                                  className="sellGradeScoreFill"
                                  style={{
                                    width: `${result.conditionScore}%`,
                                    background:
                                      result.conditionScore >= 80
                                        ? "#16a34a"
                                        : result.conditionScore >= 60
                                        ? "#2563eb"
                                        : result.conditionScore >= 40
                                        ? "#d97706"
                                        : "#dc2626",
                                  }}
                                />
                              </div>
                              <span className="sellGradeScoreNum">{result.conditionScore}/100</span>
                            </div>

                            {result.detectedIssues?.length > 0 && (
                              <div className="sellGradeIssues">
                                <b>Detected issues:</b>
                                <ul>
                                  {result.detectedIssues.map((issue, i) => (
                                    <li key={i}>• {issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="sellPriceBox">
                              <div className="sellPriceRow">
                                <span className="sellPriceLabel">Original Price</span>
                                <span className="sellPriceOrig">₹{result.originalPrice?.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="sellPriceRow">
                                <span className="sellPriceLabel">AI Suggested Price</span>
                                <span className="sellPriceSuggested">₹{result.suggestedPrice?.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="sellCreditsEarn">
                                🌱 You'll earn <b>+25 Green Credits</b> when listed
                              </div>
                            </div>

                            <button
                              className="sellListBtn"
                              onClick={() => handleList(item)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Listing…" : "✅ List on Second Life"}
                            </button>
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
    </div>
  );

};

export default SellOnSecondLife;

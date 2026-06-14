import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/productDetails.css";
import loaderImg from "../assets/loading-gif.gif";
import { addToCart } from "../utils/addToCart";
import Toast from "../components/Toast";

// Hardcoded AI Fit Insights — seeded for select products to power the Return Prevention feature
const FIT_INSIGHTS = {
  "Nike Air Max Pulse": {
    text: "23% of buyers found this runs small — consider sizing up for a comfortable fit.",
    icon: "📏",
    type: "warning",
  },
  "Adidas Ultraboost 22": {
    text: "True to size for 92% of buyers. High satisfaction rate for this model.",
    icon: "✅",
    type: "good",
  },
  "Levi's 511 Slim Fit Jeans": {
    text: "31% of buyers sized up — this style runs slim through the thigh. Size up if you prefer a relaxed fit.",
    icon: "📐",
    type: "warning",
  },
  "Puma RS-X Reinvention": {
    text: "Wide fit — 28% of buyers found this runs slightly large. Consider sizing down.",
    icon: "⚠️",
    type: "info",
  },
  "New Balance 574 Classic": {
    text: "True to size. Fits as expected for 89% of buyers.",
    icon: "✅",
    type: "good",
  },
};

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [qty, setQty]         = useState(1);
  const [toast, setToast]     = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // const API_BASE_URL = "http://localhost:5000" //local work

  useEffect(() => {
    fetch(`${API_BASE_URL}/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch((err) => {
        console.error("Failed to load product:", err);
        setToast({ msg: "Could not load product. Please try again.", type: "error" });
      });
  }, [id, API_BASE_URL]);

  if (!product) {
    return (
      <p
        style={{
          height: "55vh",
          fontSize: "40px",
          textAlign: "center",
          marginTop: "100px",
        }}
      >
        <img src={loaderImg} width="100px" alt="Loading..." />
      </p>
    );
  }

  const handleAddToCart = async () => {
    if (!localStorage.getItem("token")) {
      setToast({ msg: "Please sign in to add items to your cart.", type: "warning" });
      return;
    }
    setAdding(true);
    const result = await addToCart(id, qty);
    if (result?.ok) {
      setToast({ msg: `${product.name} ×${qty} added to cart! 🛒`, type: "success" });
    } else {
      setToast({ msg: result?.error || "Failed to add to cart.", type: "error" });
    }
    setAdding(false);
  };

  const fitInsight = FIT_INSIGHTS[product.name];

  return (
    <div className="productDetailsPage">
      <br />
      <Link to="/" className="pdBackLink">&#10094; Back to Home</Link>
      <div className="productDetailHeaders">
        <h1>{product.name}</h1>
      </div>
      <div className="productDetailContainer">
        <div className="productDetailLeft">
          <img
            src={product.image}
            alt={product.name}
            className="pdMainImg"
          />
        </div>
        <div className="productDetailRight">
          <div className="productItemDetails">
            <div className="productBrand">{product.brand}</div>
            <div className="productName">{product.name}</div>
            <div className="productDesc">
              <b>About this item:</b>
              <br></br>
              {product.description}
            </div>
            <div className="productPrice">MRP: ₹ {product.price}.00</div>
          </div>

          {fitInsight && (
            <div
              className="fitInsightBanner"
              style={{
                background: fitInsight.type === "warning" ? "#fef3c7" : fitInsight.type === "good" ? "#dcfce7" : "#dbeafe",
                border: `1.5px solid ${fitInsight.type === "warning" ? "#fde68a" : fitInsight.type === "good" ? "#86efac" : "#93c5fd"}`,
                color: fitInsight.type === "warning" ? "#92400e" : fitInsight.type === "good" ? "#166534" : "#1e40af",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{fitInsight.icon}</span>
              <span>
                <b>AI Fit Insight</b> &nbsp;·&nbsp; {fitInsight.text}
              </span>
            </div>
          )}

          {/* Quantity selector */}
          <div className="pdQtyRow">
            <span className="pdQtyLabel">Qty:</span>
            <button className="pdQtyBtn" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
            <span className="pdQtyNum">{qty}</span>
            <button className="pdQtyBtn" onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10}>+</button>
          </div>

          <button className="productDetailButton" onClick={handleAddToCart} disabled={adding}>
            {adding ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default ProductDetails;

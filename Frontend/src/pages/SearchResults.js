import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { addToCart } from "../utils/addToCart";
import Toast from "../components/Toast";
import "../styles/SearchResult.css";

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [adding, setAdding]     = useState({});
  const [toast, setToast]       = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setProducts([]);
    fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setToast({ msg: "Search failed. Please try again.", type: "error" }))
      .finally(() => setLoading(false));
  }, [query, API_BASE_URL]);

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({ msg: "Please sign in to add items to your cart.", type: "warning" });
      return;
    }
    setAdding((p) => ({ ...p, [product._id]: true }));
    const result = await addToCart(product._id, 1);
    if (result?.ok) {
      setToast({ msg: `${product.name} added to cart!`, type: "success" });
    } else {
      setToast({ msg: result?.error || "Failed to add to cart.", type: "error" });
    }
    setAdding((p) => ({ ...p, [product._id]: false }));
  };

  return (
    <div className="productDetailsPage">
      <br />
      <Link to="/">&#10094; Back</Link>
      <h2>Search Results for "{query}"</h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: "#6b7280", fontSize: 16 }}>Searching for <b>{query}</b>…</p>
          <div style={{ width: 40, height: 40, border: "4px solid #f3f4f6", borderTop: "4px solid #ff9900", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "16px auto" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48 }}>🔎</div>
          <h3 style={{ color: "#374151", marginTop: 12 }}>No results for "{query}"</h3>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>Try a different search term or browse categories.</p>
          <Link to="/" style={{ background: "#ff9900", color: "#131921", padding: "10px 24px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="productGrid">
          {products.map((product) => (
            <div key={product._id} className="searchResultContainer">
              <div className="productDetailLeft">
                <img src={product.image} alt={product.name} style={{ width: "500px" }} />
              </div>
              <div className="productDetailRight">
                <div className="productItemDetails">
                  <div className="productBrand">{product.brand}</div>
                  <div className="productName">{product.name}</div>
                  <div className="productDesc">{product.description}</div>
                  <div className="productPrice">MRP: ₹ {product.price}.00</div>
                </div>
                <button
                  className="productDetailButton"
                  onClick={() => handleAddToCart(product)}
                  disabled={adding[product._id]}
                >
                  {adding[product._id] ? "Adding…" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

export default SearchResults;

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import loader from "./assets/loaderSpinner.gif";
import Footer from "./components/Footer";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import SearchResults from "./pages/SearchResults";
import ScrollToTop from "./components/ScrollToTop";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./utils/ProtectedRoute";
import Cart from "./pages/Cart";
import CategoryProducts from "./pages/CategoryProducts";
import Returns from "./pages/Returns";
import ReturnTracking from "./pages/ReturnTracking";
import RedeemCredits from "./pages/RedeemCredits";
import SecondLife from "./pages/SecondLife";
import SecondLifeDashboard from "./pages/SecondLifeDashboard";
import SellOnSecondLife from "./pages/SellOnSecondLife";
import WarehouseAdmin from "./pages/WarehouseAdmin";
import CustomerSupport from "./pages/CustomerSupport";
import ProductPassport from "./pages/ProductPassport";
import BackToTop from "./components/BackToTop";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return (
      <div className="loader">
        <img src={loader} alt="loading" />
      </div>
    );
  }

  return (
    <Router>
      <div>
        <Navbar />
        <ScrollToTop />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route exact path="/category-products" element={<CategoryProducts />} /> 
          <Route path="/search" element={<SearchResults />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <Returns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns/tracking/:returnId"
            element={
              <ProtectedRoute>
                <ReturnTracking />
              </ProtectedRoute>
            }
          />
          <Route path="/second-life" element={<SecondLife />} />
          <Route
            path="/redeem"
            element={
              <ProtectedRoute>
                <RedeemCredits />
              </ProtectedRoute>
            }
          />
          <Route path="/second-life/dashboard" element={<SecondLifeDashboard />} />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute>
                <WarehouseAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/second-life/sell"
            element={
              <ProtectedRoute>
                <SellOnSecondLife />
              </ProtectedRoute>
            }
          />
          <Route path="/support" element={<CustomerSupport />} />
          <Route
            path="/passport/:productId"
            element={
              <ProtectedRoute>
                <ProductPassport />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={
            <div style={{ textAlign: "center", padding: "100px 20px", minHeight: "60vh" }}>
              <div style={{ fontSize: 72 }}>🔍</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#131921", margin: "16px 0 8px" }}>404 — Page Not Found</h1>
              <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 32 }}>The page you're looking for doesn't exist or has been moved.</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/" style={{ background: "#ff9900", color: "#131921", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
                  Go Home
                </a>
                <a href="/second-life" style={{ background: "#064e3b", color: "#6ee7b7", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
                  🌿 Second Life
                </a>
              </div>
            </div>
          } />
        </Routes>
        <BackToTop />
        <Footer />
      </div>
    </Router>
  );
}

export default App;

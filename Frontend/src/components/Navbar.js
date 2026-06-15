import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/amazon-logo.svg";
import userPng from "../assets/userAvatar.png";
import { FiShoppingCart } from "react-icons/fi";
import { BsSearch } from "react-icons/bs";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdOutlineLocationOn } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import Toast from "./Toast";

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [greenCredits, setGreenCredits] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  const { pathname } = useLocation();
  const isWarehouse = !!token && userRole === "warehouse";
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Fetch green credits from API
  useEffect(() => {
    if (!token) return;
    const stored = localStorage.getItem("greenCredits");
    if (stored) setGreenCredits(parseInt(stored) || 0);
    fetch(`${API_BASE_URL}/api/green-credits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.greenCredits !== undefined) {
          setGreenCredits(d.greenCredits);
          localStorage.setItem("greenCredits", d.greenCredits);
        }
      })
      .catch(() => {});
  }, [token, API_BASE_URL]);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCartCount(data.reduce((s, i) => s + i.quantity, 0));
      }
    } catch {}
  }, [API_BASE_URL, token]);

  // Listen for green credits and cart updates from other pages
  useEffect(() => {
    fetchCartCount();
    const onGreenCredits = () => {
      const stored = localStorage.getItem("greenCredits");
      setGreenCredits(parseInt(stored) || 0);
    };
    const onCartUpdate = () => fetchCartCount();
    window.addEventListener("greenCreditsUpdated", onGreenCredits);
    window.addEventListener("cartUpdated", onCartUpdate);
    return () => {
      window.removeEventListener("greenCreditsUpdated", onGreenCredits);
      window.removeEventListener("cartUpdated", onCartUpdate);
    };
  }, [fetchCartCount]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery.trim()}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToast({ msg: "You have been signed out.", type: "info" });
    setTimeout(() => navigate("/signin"), 1200);
  };

  const CartIcon = ({ size = 20 }) => (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <FiShoppingCart title="Cart" size={size} />
      {token && cartCount > 0 && (
        <span className="navCartBadge">{cartCount > 9 ? "9+" : cartCount}</span>
      )}
    </div>
  );

  if (isWarehouse) {
    return (
      <>
        <div className="warehouseNav">
          <div className="warehouseNavLogo">
            <img src={logo} alt="Amazon" className="warehouseNavLogoImg" />
            <span className="warehouseNavLabel">IHS Store Portal</span>
          </div>
          <div className="warehouseNavRight">
            <Link to="/warehouse" className="warehouseNavLink">🏭 Inventory</Link>
            <span className="warehouseNavUser">👤 {userName}</span>
            <button className="warehouseNavLogout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
        <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div>
      <div className="navbar">
        <div className="navbarLeft">
          <Link to="/">
            <img className="navbarLogo" src={logo} alt="Amazon" />
          </Link>
          <div className="navbarLocation">
            <MdOutlineLocationOn color="#ff9900" />
            India
          </div>
          <div className="navbarSearchBar">
            <input
              className="navbarSearch"
              name="Search"
              type="text"
              placeholder="Search Amazon Products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              style={{
                backgroundColor: "#ff9900",
                border: "none",
                padding: "0 14px",
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexShrink: 0,
              }}
            >
              <BsSearch color="#fff" size={18} />
            </button>
          </div>
        </div>
        <div className="navbarRight">
          <ul className="navbarTopLinks">
            <li>
              <Link to="/cart" className="cartLink">
                <CartIcon size={20} />
              </Link>
            </li>
            {token ? (
              <li>
                <Link onClick={handleLogout} className="cartLink">
                  <FiLogOut title="Logout" size={20} />
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/signin" className="cartLink">
                  Sign In
                </Link>
              </li>
            )}

            {token && (
              <li>
                <Link
                  to="/redeem"
                  className={`cartLink greenCreditsChip ${greenCredits === 0 ? "greenCreditsChip--zero" : ""}`}
                  title="Redeem Green Credits"
                >
                  🌿 {greenCredits} pts
                </Link>
              </li>
            )}
            <li>
              <img width="32px" src={userPng} alt="Amazon" />
              <h4>&nbsp; {userName}</h4>
            </li>
          </ul>
        </div>
      </div>

      <div className="navbarSmallScreen">
        <div className="navbarLeftSmallScreen">
          <img width="30px" src={userPng} alt="Amazon" />
        </div>
        <div className="navbarLogoSmallScreen">
          <Link to="/">
            <img src={logo} alt="Amazon" />
          </Link>
        </div>
        <div className="navbarRight">
          <ul className="navbarTopLinksSmallScreen">
            <li>
              <Link to="/cart" className="cartLink">
                <CartIcon size={20} />
              </Link>
            </li>
            {token ? (
              <li>
                <Link onClick={handleLogout} className="cartLink">
                  <FiLogOut title="Logout" size={20} />
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/signin" className="cartLink">
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="navbarSearchBarSmallScreen">
        <input
          className="navbarSearchSmallScreen"
          name="Search"
          type="text"
          placeholder="Search Amazon Products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          style={{
            backgroundColor: "#ff9900",
            border: "none",
            padding: "0 14px",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 38,
            flexShrink: 0,
          }}
        >
          <BsSearch color="#fff" size={18} />
        </button>
      </div>

      <div className="navbarBottom">
        <div>
          <ul className="navbarBottomLinks">
            <li>
              <Link to="/" className={pathname === "/" ? "navLinkActive" : ""}>🏠 Home</Link>
            </li>
            <li>
              <Link to="/category-products?type=All">
                <GiHamburgerMenu />
                &nbsp;&nbsp;All
              </Link>
            </li>
            <li>
              <Link to="/category-products?type=Shoes">Shoes</Link>
            </li>
            <li>
              <Link to="/category-products?type=Bags">Backpacks</Link>
            </li>
            <li>
              <Link to="/cart">Cart Items</Link>
            </li>
            {token && (
              <li>
                <Link to="/returns" style={{ color: "#ff9900", fontWeight: 700 }}>↩ Returns</Link>
              </li>
            )}
            <li>
              <Link to="/second-life" style={{ color: "#6ee7b7", fontWeight: 700 }}>🌿 Second Life</Link>
            </li>
            <li>
              <Link to="/second-life/dashboard" style={{ color: "#9ca3af" }}>♻️ Dashboard</Link>
            </li>
            {token && (
              <li>
                <Link to="/redeem" style={{ color: "#6ee7b7", fontWeight: 700 }}>🌿 Redeem</Link>
              </li>
            )}
            {token && userRole === "warehouse" && (
              <li>
                <Link to="/warehouse" style={{ color: "#ff9900", fontWeight: 700 }}>🏭 IHS Store</Link>
              </li>
            )}
            <li>
              <Link to="/support" style={{ color: "#ff9900", fontWeight: 700 }}>💬 Support</Link>
            </li>
          </ul>
        </div>
      </div>

      <Toast message={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

export default Navbar;

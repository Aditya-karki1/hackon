import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignIn.css";
import Toast from "../components/Toast";

function SignIn() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("user");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const fillWarehouse = () => {
    setEmail("warehouse@amazon.com");
    setPassword("warehouse123");
    setRole("warehouse");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.name || "");
        localStorage.setItem("userRole", data.role || "user");
        if (data.role === "warehouse") {
          navigate("/warehouse");
        } else {
          navigate("/");
        }
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authContainer">
      {/* Role selector */}
      <div className="signInRoleRow">
        <button
          type="button"
          className={`signInRoleBtn ${role === "user" ? "signInRoleBtn--active" : ""}`}
          onClick={() => { setRole("user"); setEmail(""); setPassword(""); }}
        >
          🛒 Customer
        </button>
        <button
          type="button"
          className={`signInRoleBtn ${role === "warehouse" ? "signInRoleBtn--active signInRoleBtn--warehouse" : ""}`}
          onClick={fillWarehouse}
        >
          🏭 IHS Store Staff
        </button>
      </div>

      {role === "warehouse" && (
        <div className="signInWarehouseBanner">
          <span>🔐</span>
          <span>IHS Store Portal — staff only &nbsp;·&nbsp; <b>Demo credentials auto-filled</b></span>
        </div>
      )}

      <h2>{role === "warehouse" ? "IHS Store Sign In" : "Sign In"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", paddingRight: 44, boxSizing: "border-box" }}
          />
          <button type="button" onClick={() => setShowPass((p) => !p)} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6b7280",
          }}>
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 8, textAlign: "left" }}>
            ❌ {error}
          </div>
        )}
        <button className="productDetailButton" type="submit" disabled={loading}>
          {loading ? "Signing in…" : role === "warehouse" ? "Enter IHS Store Portal" : "Sign In"}
        </button>
      </form>

      {role === "user" && (
        <>
          <h2>If you don't have an account</h2>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </div>
  );
}

export default SignIn;

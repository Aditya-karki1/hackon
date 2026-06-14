import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignIn.css";

function SignUp() {
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPass, setShowPass]     = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 || !/[0-9]/.test(password) ? 2
    : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "#dc2626", "#d97706", "#16a34a"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate("/signin", { state: { signedUp: true } });
      } else {
        setError(data.error || "Sign-up failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authContainer">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password + show toggle */}
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password (min 6 characters)"
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

        {/* Password strength bar */}
        {password.length > 0 && (
          <div style={{ marginTop: 4, marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3].map((lvl) => (
                <div key={lvl} style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: strength >= lvl ? strengthColor : "#e5e7eb",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
          </div>
        )}

        <input
          type={showPass ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ borderColor: confirm && password !== confirm ? "#dc2626" : "" }}
        />
        {confirm && password !== confirm && (
          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, textAlign: "left", display: "block", marginTop: -4 }}>
            Passwords don't match
          </span>
        )}

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, textAlign: "left" }}>
            ❌ {error}
          </div>
        )}

        <button className="productDetailButton" type="submit" disabled={loading || (confirm && password !== confirm)}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
      <Link to="/signin">Already have an account? Sign In</Link>
    </div>
  );
}

export default SignUp;

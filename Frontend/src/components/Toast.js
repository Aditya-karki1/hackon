import React, { useEffect } from "react";

const STYLES = {
  success: { bg: "#dcfce7", border: "#86efac", color: "#166534", icon: "✅" },
  error:   { bg: "#fee2e2", border: "#fca5a5", color: "#991b1b", icon: "❌" },
  info:    { bg: "#dbeafe", border: "#93c5fd", color: "#1e40af", icon: "ℹ️" },
  warning: { bg: "#fef9c3", border: "#fde047", color: "#854d0e", icon: "⚠️" },
};

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  const s = STYLES[type] || STYLES.success;

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: s.bg, border: `1.5px solid ${s.border}`, color: s.color,
      padding: "14px 18px", borderRadius: 12, fontWeight: 700, fontSize: 14,
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 6px 24px rgba(0,0,0,0.13)", maxWidth: 360,
      animation: "toastIn 0.25s ease-out",
    }}>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: s.color, fontSize: 17, padding: 0, lineHeight: 1, opacity: 0.7,
      }}>✕</button>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

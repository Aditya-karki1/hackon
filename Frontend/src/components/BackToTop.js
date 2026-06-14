import React, { useState, useEffect } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      style={{
        position: "fixed",
        bottom: 28,
        left: 28,
        zIndex: 9998,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#131921",
        color: "#ff9900",
        border: "2px solid #ff9900",
        fontSize: 20,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        transition: "opacity 0.2s, transform 0.2s",
        animation: "fadeInUp 0.25s ease-out",
      }}
    >
      ↑
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </button>
  );
}

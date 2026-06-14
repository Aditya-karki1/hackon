import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/CustomerSupport.css";

const QUICK_REPLIES = [
  "How do I recycle a product?",
  "How does Second Life work?",
  "What are Green Credits?",
  "How do I return a damaged item?",
  "What is a returnless refund?",
  "How do I list an item for resale?",
];

const CONTEXT_QUICK_REPLIES = [
  "What's the status of my return?",
  "When will my item be picked up?",
  "What will happen to my item?",
  "How do I track my return?",
  "How many Green Credits will I earn?",
  "Can I change my return option?",
];

const CONTACT_OPTIONS = [
  {
    icon: "📞",
    title: "Call Us",
    subtitle: "24/7 Toll-Free Support",
    detail: "1800-3000-9009",
    action: "tel:18003000009",
    actionLabel: "Call Now",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#86efac",
  },
  {
    icon: "💬",
    title: "Live Chat",
    subtitle: "Avg. wait time: 2 min",
    detail: "Chat with a human agent",
    action: null,
    actionLabel: "Start Chat",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    icon: "📧",
    title: "Email Support",
    subtitle: "Response within 24 hrs",
    detail: "support@amazon.in",
    action: "mailto:support@amazon.in",
    actionLabel: "Send Email",
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#d8b4fe",
  },
];

const FAQ = [
  {
    q: "How do I recycle a product?",
    a: "Go to Returns Centre → upload a photo → let AI inspect it. If the item is in poor/damaged condition, the AI will recommend 'Eco Recycle'. Confirm and a pickup is scheduled to a certified recycling centre — no landfill.",
  },
  {
    q: "What is the Second Life marketplace?",
    a: "Second Life lets you resell pre-owned items in Good or Fair condition instead of discarding them. Sellers earn Green Credits; buyers get items at 40–70% off original price. Visit /second-life to browse listings.",
  },
  {
    q: "What are Green Credits and how do I use them?",
    a: "Green Credits are earned for eco-friendly actions — recycling, Second Life listings, buying pre-owned items, and returnless refunds. Redeem them at /redeem for discount coupons like 5% off, ₹150 flat off, or free delivery.",
  },
  {
    q: "What is a returnless refund?",
    a: "For low-value items (under ₹800) shipped over 300 km, we automatically refund you without requiring the item back. You keep the item and earn 20 Green Credits — saving logistics cost and carbon emissions.",
  },
  {
    q: "How do I track my return?",
    a: "Go to Return Tracking under your account. You'll see real-time status: Pickup Scheduled → Picked Up → Inspected → Refund Issued. You'll also get email and SMS updates at each stage.",
  },
  {
    q: "How long does a refund take?",
    a: "Refunds are processed within 3–5 business days after we receive and inspect your item. Returnless refunds are instant — credited to your original payment method within 24 hours.",
  },
  {
    q: "Can I cancel or change my return?",
    a: "Yes, you can change your return option anytime before pickup is scheduled. Once the pickup slot is confirmed, cancellations must be done at least 2 hours before the pickup time.",
  },
  {
    q: "What items are eligible for Second Life resale?",
    a: "Items graded 'Good' or 'Fair' by our AI inspection are eligible. Electronics, books, clothing, and home goods qualify. Perishables, consumables, and items graded 'Poor' are not eligible for resale.",
  },
];

const HARDCODED_RESPONSES = [
  {
    keywords: ["recycle", "recycling", "eco recycle", "dispose"],
    reply: "To recycle a product:\n1. Go to **Returns Centre** and select your item\n2. Upload a clear photo of the item\n3. Our AI will inspect and grade it\n4. If graded Poor/Damaged, you'll see the 'Eco Recycle' option\n5. Confirm and we schedule a pickup to a certified recycling centre — zero landfill!\n\nYou'll earn **15 Green Credits** for every item recycled. 🌱",
  },
  {
    keywords: ["second life", "resell", "resale", "pre-owned", "sell", "list item", "listing"],
    reply: "**Second Life** is our circular economy marketplace!\n\n• Items graded *Good* or *Fair* by AI inspection are listed automatically\n• Buyers get items at **40–70% off** original price\n• You (the seller) earn **Green Credits** instead of a cash refund\n• Listings go live within 24 hrs of pickup\n\nVisit **/second-life** to browse or **/sell-on-second-life** to list your item now.",
  },
  {
    keywords: ["green credit", "credits", "redeem", "coupon", "earn credit"],
    reply: "**Green Credits** are earned for eco-friendly actions:\n\n• ♻️ Recycling an item → 15 credits\n• 🔄 Second Life listing sold → 25 credits\n• 🛍️ Buying a pre-owned item → 10 credits\n• 📦 Returnless refund → 20 credits\n\n**Redeem at /redeem for:**\n• 5% off your next order\n• ₹150 flat discount\n• Free delivery voucher\n• 10% off on electronics",
  },
  {
    keywords: ["returnless refund", "keep the item", "no return", "low value"],
    reply: "**Returnless Refund** — we refund you and you keep the item!\n\nEligibility:\n• Item value under **₹800**\n• Shipped from more than **300 km** away\n• Item is damaged or defective\n\nYour refund is credited within **24 hours** and you automatically earn **20 Green Credits**. This saves logistics costs and reduces carbon emissions. 🌍",
  },
  {
    keywords: ["return", "how to return", "initiate return", "start return", "damaged item", "defective"],
    reply: "Here's how to return an item:\n\n1. Go to **Returns Centre** (/returns)\n2. Select the order and reason for return\n3. Upload a photo — our AI inspects it instantly\n4. Based on the grade, you'll get options:\n   - ✅ **Full Refund** (item shipped back)\n   - 🔄 **Second Life** (we resell it)\n   - ♻️ **Eco Recycle** (certified recycling)\n   - 🎁 **Returnless Refund** (keep it + get refund)\n5. Choose your option and schedule pickup\n\nNeed help? Call **1800-3000-9009** (toll-free, 24/7).",
  },
  {
    keywords: ["track", "status", "where is", "pickup", "when will", "update"],
    reply: "You can track your return at **/return-tracking**.\n\nReturn journey stages:\n📅 **Pickup Scheduled** → your slot is confirmed\n🚚 **Picked Up** → item collected from your address\n🔍 **Inspected** → AI + warehouse check complete\n💰 **Refund Issued** → credited to your payment method\n\nYou'll get **SMS + email** updates at every stage. Pickup usually happens within **2–3 business days** of initiating the return.",
  },
  {
    keywords: ["how many credits", "credits will i earn", "how much credit"],
    reply: "Here's what you earn:\n\n| Action | Green Credits |\n|--------|---------------|\n| Recycling | 15 credits |\n| Second Life sale | 25 credits |\n| Buying pre-owned | 10 credits |\n| Returnless refund | 20 credits |\n\nCredits never expire and can be redeemed at **/redeem** for coupons and discounts!",
  },
  {
    keywords: ["change return", "cancel return", "different option", "switch option"],
    reply: "You can **change your return option** anytime before pickup is confirmed.\n\nHow to change:\n1. Go to **Return Tracking** (/return-tracking)\n2. Find your return request\n3. Click 'Change Option' if pickup isn't scheduled yet\n\nIf pickup is already scheduled, call **1800-3000-9009** at least **2 hours before** the pickup time to reschedule.\n\nFor urgent changes, email us at **support@amazon.in**.",
  },
  {
    keywords: ["human agent", "human", "real person", "speak to someone", "talk to agent", "live agent", "live chat"],
    reply: "Connecting you with a human agent! 🙋\n\nQuickest ways to reach us:\n• 📞 **Call:** 1800-3000-9009 (toll-free, 24/7, avg wait: 3 min)\n• 💬 **Live Chat:** Available Mon–Sat, 8am–11pm IST\n• 📧 **Email:** support@amazon.in (response within 24 hrs)\n\nFor live chat, click **'Start Chat'** above. Our agents are standing by!",
  },
  {
    keywords: ["refund", "money back", "when refund", "refund status"],
    reply: "**Refund timelines:**\n\n• Returnless Refund → **within 24 hours**\n• Standard return (after inspection) → **3–5 business days**\n• UPI / Net Banking → 1–2 days after processing\n• Credit/Debit Card → 5–7 business days\n• Amazon Pay balance → instant\n\nYou'll get an email confirmation once your refund is processed. Track it at **/return-tracking**.",
  },
  {
    keywords: ["eligible", "can i return", "return policy", "what can i return"],
    reply: "**Return eligibility:**\n\n✅ **Eligible:** Electronics, clothing, books, home goods, toys — within 10 days of delivery\n✅ **Damaged/defective items** — any time, no questions asked\n\n❌ **Not eligible:** Perishables, digital content, customized items, hazardous materials\n\nAll returned items go through AI inspection to determine the best eco-friendly option. To start a return, visit **/returns**.",
  },
  {
    keywords: ["contact", "phone", "email", "reach", "help", "support"],
    reply: "Here's how to reach us:\n\n📞 **Phone:** 1800-3000-9009 (toll-free, 24/7)\n💬 **Live Chat:** Mon–Sat, 8am–11pm IST (avg wait: 2 min)\n📧 **Email:** support@amazon.in (within 24 hrs)\n\n🤖 **AI Chat (me!):** Always available — just type your question here!",
  },
];

const DISPOSITION_LABELS = {
  RETURN: "Full Refund",
  RESELL_LOCAL: "Second Life",
  RECYCLE: "Eco Recycle",
  REFURBISH: "Refurbished",
  RETURNLESS_REFUND: "Returnless Refund",
};

export default function CustomerSupport() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm Aria 👋, your eco-return assistant. I can help you recycle products, list items on Second Life, understand Green Credits, or guide you through the returns process. What can I help with?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [orders, setOrders] = useState([]);
  const [userReturns, setUserReturns] = useState([]);
  const [pinnedOrder, setPinnedOrder] = useState(null);
  const [pinnedReturn, setPinnedReturn] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!token) return;
    setContextLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/returns`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([ordersRes, returnsRes]) => {
        setOrders(ordersRes.data.slice(0, 5));
        setUserReturns(returnsRes.data.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setContextLoading(false));
  }, [API_BASE_URL, token]);

  const getHardcodedReply = (text) => {
    const lower = text.toLowerCase();

    if (pinnedReturn) {
      const ret = pinnedReturn;
      const label = DISPOSITION_LABELS[ret.aiDisposition] || ret.aiDisposition || "Pending";
      if (lower.includes("status") || lower.includes("update") || lower.includes("track")) {
        return `Your return for **${ret.productName}** is currently:\n\n• Grade: **${ret.aiGrade || "Pending AI Inspection"}**\n• Decision: **${label}**\n\nTrack real-time updates at **/return-tracking**. You'll also get SMS/email notifications at each stage.`;
      }
      if (lower.includes("pickup") || lower.includes("pick up") || lower.includes("when")) {
        return `Pickup for **${ret.productName}** is typically scheduled within **2–3 business days**. You'll receive an SMS with the exact time slot. To reschedule, call **1800-3000-9009**.`;
      }
      if (lower.includes("happen") || lower.includes("what will") || lower.includes("where")) {
        return `Your **${ret.productName}** (graded: ${ret.aiGrade || "Pending"}) will be handled as: **${label}**.\n\n${label === "Second Life" ? "It will be listed on our marketplace for another buyer at a discounted price." : label === "Eco Recycle" ? "It will be sent to a certified recycling partner — zero landfill." : label === "Returnless Refund" ? "You keep the item and receive a full refund within 24 hours." : "It will be returned to our warehouse and your refund will be processed in 3–5 business days."}`;
      }
      if (lower.includes("credit") || lower.includes("earn")) {
        return `For your **${ret.productName}** return:\n\n${ret.aiDisposition === "RECYCLE" ? "♻️ Eco Recycle → **15 Green Credits**" : ret.aiDisposition === "RESELL_LOCAL" ? "🔄 Second Life listing → **25 Green Credits** when sold" : ret.aiDisposition === "RETURNLESS_REFUND" ? "📦 Returnless Refund → **20 Green Credits** (instant)" : "Standard return → no Green Credits (choose Second Life or Recycle to earn credits!)"}\n\nRedeem credits at **/redeem** for discount coupons.`;
      }
      if (lower.includes("change") || lower.includes("cancel") || lower.includes("switch")) {
        return `To change the return option for **${ret.productName}**, go to **/return-tracking** and click 'Change Option' if pickup isn't confirmed yet. If pickup is already scheduled, call **1800-3000-9009** at least 2 hours before the slot.`;
      }
    }

    if (pinnedOrder) {
      const order = pinnedOrder;
      if (lower.includes("return") || lower.includes("refund") || lower.includes("damaged")) {
        return `To return **${order.productName}** (₹${order.productPrice?.toLocaleString("en-IN")}):\n\n1. Go to **Returns Centre** (/returns)\n2. Select this order\n3. Upload a photo — AI inspects it instantly\n4. Choose: Full Refund, Second Life, Eco Recycle, or Returnless Refund\n5. Schedule pickup\n\nNeed help? Call **1800-3000-9009** (toll-free, 24/7).`;
      }
    }

    for (const item of HARDCODED_RESPONSES) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        return item.reply;
      }
    }

    return `Thanks for reaching out! I'm here to help with returns, recycling, Second Life, and Green Credits.\n\nFor anything else, our team is ready:\n📞 **1800-3000-9009** (toll-free, 24/7)\n📧 **support@amazon.in**\n\nOr try one of the quick questions below — or rephrase and I'll do my best! 😊`;
  };

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = getHardcodedReply(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: reply, time: new Date() }]);
      setLoading(false);
      inputRef.current?.focus();
    }, 600);
  };

  const togglePinOrder = (order) =>
    setPinnedOrder((prev) => (prev?._id === order._id ? null : order));

  const togglePinReturn = (ret) =>
    setPinnedReturn((prev) => (prev?._id === ret._id ? null : ret));

  const activeQuickReplies = (pinnedOrder || pinnedReturn) ? CONTEXT_QUICK_REPLIES : QUICK_REPLIES;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="cs-page">

      {/* ── Hero ── */}
      <div className="cs-hero">
        <div className="cs-hero-inner">
          <Link to="/" className="cs-back">← Back to Home</Link>
          <div className="cs-hero-content">
            <div>
              <h1 className="cs-hero-title">Customer Support</h1>
              <p className="cs-hero-sub">Get instant help from our AI assistant or connect with a human agent.</p>
            </div>
            <div className="cs-hero-badge">
              <span className="cs-live-dot" />
              Support Online
            </div>
          </div>
        </div>
      </div>

      <div className="cs-body">

        {/* ── Contact Options ── */}
        <div className="cs-contact-strip">
          {CONTACT_OPTIONS.map((opt) => (
            <div key={opt.title} className="cs-contact-card" style={{ background: opt.bg, borderColor: opt.border }}>
              <div className="cs-contact-icon" style={{ color: opt.color }}>{opt.icon}</div>
              <div className="cs-contact-info">
                <div className="cs-contact-title" style={{ color: opt.color }}>{opt.title}</div>
                <div className="cs-contact-sub">{opt.subtitle}</div>
                <div className="cs-contact-detail">{opt.detail}</div>
              </div>
              {opt.action ? (
                <a href={opt.action} className="cs-contact-btn" style={{ background: opt.color }}>
                  {opt.actionLabel}
                </a>
              ) : (
                <button
                  className="cs-contact-btn"
                  style={{ background: opt.color }}
                  onClick={() => sendMessage("I'd like to chat with a human agent.")}
                >
                  {opt.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Main Content ── */}
        <div className="cs-main-grid">

          {/* ── Chat Section ── */}
          <div className="cs-chat-panel">
            <div className="cs-chat-header">
              <div className="cs-chat-avatar">🤖</div>
              <div>
                <div className="cs-chat-agent-name">Aria — AI Support</div>
                <div className="cs-chat-agent-status">
                  <span className="cs-live-dot cs-live-dot--sm" /> Always online
                </div>
              </div>
              {(pinnedOrder || pinnedReturn) && (
                <div className="cs-chat-context-pill">
                  📋 Context: {pinnedReturn ? pinnedReturn.productName : pinnedOrder?.productName}
                </div>
              )}
              <div className="cs-chat-powered">Powered by AI</div>
            </div>

            {/* Messages */}
            <div className="cs-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`cs-msg-row cs-msg-row--${msg.role}`}>
                  {msg.role === "bot" && (
                    <div className="cs-msg-avatar">🤖</div>
                  )}
                  <div className={`cs-bubble cs-bubble--${msg.role}`}>
                    <div className="cs-bubble-text">{msg.text}</div>
                    <div className="cs-bubble-time">{formatTime(msg.time)}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="cs-msg-avatar cs-msg-avatar--user">👤</div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="cs-msg-row cs-msg-row--bot">
                  <div className="cs-msg-avatar">🤖</div>
                  <div className="cs-bubble cs-bubble--bot cs-bubble--typing">
                    <span className="cs-dot" />
                    <span className="cs-dot" />
                    <span className="cs-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && !loading && (
              <div className="cs-quick-replies">
                {activeQuickReplies.map((q) => (
                  <button key={q} className="cs-quick-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="cs-input-row">
              <textarea
                ref={inputRef}
                className="cs-input"
                placeholder="Type your question here…"
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="cs-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                <span className="cs-send-icon">➤</span>
              </button>
            </div>
            <p className="cs-input-hint">Press Enter to send · Shift+Enter for new line</p>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="cs-sidebar">

            {/* Context Panel */}
            <div className="cs-context-card">
              <div className="cs-context-header">
                <span>📋</span>
                <span>Your Recent Activity</span>
                {contextLoading && <span className="cs-context-loading">Loading…</span>}
              </div>

              {(pinnedOrder || pinnedReturn) && (
                <div className="cs-context-active">
                  <div className="cs-context-active-label">Active Context</div>
                  {pinnedOrder && (
                    <div className="cs-context-pinned">
                      <span className="cs-context-pinned-icon">🛒</span>
                      <div className="cs-context-pinned-info">
                        <div className="cs-context-pinned-name">{pinnedOrder.productName}</div>
                        <div className="cs-context-pinned-sub">
                          Order · ₹{pinnedOrder.productPrice?.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button className="cs-context-unpin" onClick={() => setPinnedOrder(null)}>✕</button>
                    </div>
                  )}
                  {pinnedReturn && (
                    <div className="cs-context-pinned">
                      <span className="cs-context-pinned-icon">📦</span>
                      <div className="cs-context-pinned-info">
                        <div className="cs-context-pinned-name">{pinnedReturn.productName}</div>
                        <div className="cs-context-pinned-sub">
                          Return · {pinnedReturn.aiGrade || "Pending"}{pinnedReturn.aiDisposition ? ` · ${DISPOSITION_LABELS[pinnedReturn.aiDisposition] || pinnedReturn.aiDisposition}` : ""}
                        </div>
                      </div>
                      <button className="cs-context-unpin" onClick={() => setPinnedReturn(null)}>✕</button>
                    </div>
                  )}
                  <div className="cs-context-active-note">
                    Aria has context about these items
                  </div>
                </div>
              )}

              {orders.length > 0 && (
                <div className="cs-context-section">
                  <div className="cs-context-section-title">Recent Orders</div>
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order._id}
                      className={`cs-context-item ${pinnedOrder?._id === order._id ? "cs-context-item--pinned" : ""}`}
                    >
                      <div className="cs-context-item-info">
                        <div className="cs-context-item-name">{order.productName}</div>
                        <div className="cs-context-item-sub">
                          ₹{order.productPrice?.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <button
                        className={`cs-context-pin-btn ${pinnedOrder?._id === order._id ? "cs-context-pin-btn--active" : ""}`}
                        onClick={() => togglePinOrder(order)}
                      >
                        {pinnedOrder?._id === order._id ? "Pinned ✓" : "Ask about"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {userReturns.length > 0 && (
                <div className="cs-context-section">
                  <div className="cs-context-section-title">Recent Returns</div>
                  {userReturns.slice(0, 3).map((ret) => (
                    <div
                      key={ret._id}
                      className={`cs-context-item ${pinnedReturn?._id === ret._id ? "cs-context-item--pinned" : ""}`}
                    >
                      <div className="cs-context-item-info">
                        <div className="cs-context-item-name">{ret.productName}</div>
                        <div className="cs-context-item-sub">
                          {ret.aiGrade || "Pending"}{ret.aiDisposition ? ` · ${DISPOSITION_LABELS[ret.aiDisposition] || ret.aiDisposition}` : ""}
                        </div>
                      </div>
                      <button
                        className={`cs-context-pin-btn ${pinnedReturn?._id === ret._id ? "cs-context-pin-btn--active" : ""}`}
                        onClick={() => togglePinReturn(ret)}
                      >
                        {pinnedReturn?._id === ret._id ? "Pinned ✓" : "Ask about"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!contextLoading && orders.length === 0 && userReturns.length === 0 && (
                <div className="cs-context-empty">
                  {token ? "No recent orders or returns found." : "Sign in to see your orders & returns."}
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className="cs-faq-card">
              <div className="cs-faq-header">
                <span>❓</span> Frequently Asked Questions
              </div>
              {FAQ.map((item, i) => (
                <div key={i} className={`cs-faq-item ${openFaq === i ? "cs-faq-item--open" : ""}`}>
                  <button
                    className="cs-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="cs-faq-chevron">{openFaq === i ? "▲" : "▼"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="cs-faq-a">{item.a}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Returns shortcut */}
            <div className="cs-shortcut-card">
              <div className="cs-shortcut-icon">↩️</div>
              <div className="cs-shortcut-info">
                <div className="cs-shortcut-title">Start a Return</div>
                <div className="cs-shortcut-sub">AI-powered inspection &amp; instant decisions</div>
              </div>
              <Link to="/returns" className="cs-shortcut-btn">Go →</Link>
            </div>

            {/* Working hours */}
            <div className="cs-hours-card">
              <div className="cs-hours-title">⏰ Support Hours</div>
              <div className="cs-hours-row"><span>AI Chat</span><span className="cs-hours-val cs-hours-green">24 / 7</span></div>
              <div className="cs-hours-row"><span>Phone Support</span><span className="cs-hours-val cs-hours-green">24 / 7</span></div>
              <div className="cs-hours-row"><span>Email Support</span><span className="cs-hours-val">Mon – Sat, 9am–9pm</span></div>
              <div className="cs-hours-row"><span>Live Agent Chat</span><span className="cs-hours-val">Mon – Sat, 8am–11pm</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

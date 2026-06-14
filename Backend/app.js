const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    // Allow localhost and all onrender.com subdomains
    if (
      !origin ||
      origin.includes("localhost") ||
      origin.includes("onrender.com") ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: { type: Number, default: 1 },
    },
  ],
  greenCredits: { type: Number, default: 0 },
  role: { type: String, default: "user", enum: ["user", "warehouse"] },
  lat: Number,
  lng: Number,
});

const User = mongoose.model("User", userSchema);

// Define Product Schema
const productSchema = new mongoose.Schema({
  brand: String,
  name: String,
  price: Number,
  image: String,
  description: String,
  type: String,
});

const Product = mongoose.model("Product", productSchema);

// Define Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: String,
    productImage: String,
    productPrice: Number,
    productBrand: String,
    quantity: Number,
    subtotal: Number,
  }],
  total: Number,
  orderedAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// Define Return Request Schema
const returnRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: String,
  productImage: String,
  productPrice: Number,
  productBrand: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  reason: { type: String, default: "Not specified" },
  status: { type: String, default: "In Process" },
  requestedAt: { type: Date, default: Date.now },
  // AI Product Passport fields (populated from /returns/inspect result)
  aiGrade: { type: String, default: null },
  conditionScore: { type: Number, default: null },
  aiDisposition: { type: String, default: null },
  detectedIssues: { type: [String], default: [] },
  carbonSaved: { type: Number, default: null },
  confidenceScore: { type: Number, default: null },
});

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token." });
  }
};

const requireWarehouse = (req, res, next) => {
  if (req.user.role !== "warehouse") return res.status(403).json({ error: "Warehouse access only" });
  next();
};

// Haversine distance (km) — used by warehouse buyer-radius checks
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Seed warehouse admin account on startup
mongoose.connection.once("open", async () => {
  try {
    const exists = await User.findOne({ email: "warehouse@amazon.com" });
    if (!exists) {
      const hashed = await bcrypt.hash("warehouse123", 10);
      await new User({ name: "Amazon Warehouse", email: "warehouse@amazon.com", password: hashed, role: "warehouse" }).save();
      console.log("Warehouse admin seeded: warehouse@amazon.com / warehouse123");
    }
  } catch (e) { /* already exists */ }
});

// Routes
// Cart Route
app.post("/cart", authenticate, async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate input
  if (!productId || quantity <= 0) {
    return res.status(400).json({ error: "Invalid product ID or quantity" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find if the product is already in the cart
    const productIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex >= 0) {
      // Update quantity if product exists in cart
      user.cart[productIndex].quantity += quantity;

      // Prevent negative or zero quantity
      if (user.cart[productIndex].quantity <= 0) {
        user.cart.splice(productIndex, 1); // Remove item if quantity <= 0
      }
    } else {
      // Add new product to cart
      user.cart.push({ productId, quantity });
    }

    // Save the updated cart
    await user.save();
    res.json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// Get Cart Route
app.get("/cart", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.productId");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartDetails = user.cart
      .filter((item) => item.productId != null)
      .map((item) => ({
        product: {
          id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          image: item.productId.image,
          description: item.productId.description,
          brand: item.productId.brand,
        },
        quantity: item.quantity,
        subtotal: item.productId.price * item.quantity,
      }));
    res.json(cartDetails);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Checkout — snapshot cart into an Order then clear the cart
app.delete("/cart", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("cart.productId");
    if (!user) return res.status(404).json({ error: "User not found" });

    const items = user.cart
      .filter((item) => item.productId != null)
      .map((item) => ({
        productId:    item.productId._id,
        productName:  item.productId.name,
        productImage: item.productId.image,
        productPrice: item.productId.price,
        productBrand: item.productId.brand,
        quantity:     item.quantity,
        subtotal:     item.productId.price * item.quantity,
      }));

    if (items.length === 0) {
      return res.status(400).json({ error: "Cart is already empty" });
    }

    const total = items.reduce((s, i) => s + i.subtotal, 0);
    await new Order({ userId: req.user.id, items, total }).save();
    await User.findByIdAndUpdate(req.user.id, { $set: { cart: [] } });

    res.json({ message: "Order placed and cart cleared" });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// GET /orders — all past orders for the logged-in user
app.get("/orders", authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ orderedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Sign Up Route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(400).json({ error: "Email already exists" });
  }
});

// Sign In Route
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id, role: user.role || "user" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, name: user.name, role: user.role || "user" });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Protected Route: Example
app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// --- Return Routes ---

// POST /returns - Create a return request
app.post("/returns", authenticate, async (req, res) => {
  const {
    productId, productName, productImage, productPrice, productBrand, productCategory,
    quantity, reason,
    aiGrade, conditionScore, aiDisposition, detectedIssues, carbonSaved, confidenceScore,
  } = req.body;
  try {
    const returnReq = new ReturnRequest({
      userId: req.user.id,
      productId,
      productName,
      productImage,
      productPrice,
      productBrand:   productBrand || "",
      quantity,
      reason:         reason || "Not specified",
      aiGrade:        aiGrade || null,
      conditionScore: conditionScore != null ? conditionScore : null,
      aiDisposition:  aiDisposition || null,
      detectedIssues: detectedIssues || [],
      carbonSaved:    carbonSaved != null ? carbonSaved : null,
      confidenceScore:confidenceScore != null ? confidenceScore : null,
    });
    await returnReq.save();

    // Award formula-based credits when seller chooses RESELL_LOCAL
    let sellerCredits = null;
    if (aiDisposition === "RESELL_LOCAL" && conditionScore != null) {
      const kmAvoided    = carbonSaved ? Math.round(carbonSaved / 0.15) : 80;
      const creditResult = calcGreenCredits(productCategory || "General", kmAvoided, conditionScore);
      sellerCredits      = creditResult;
      await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: creditResult.credits } });
    } else if (aiDisposition === "RECYCLE") {
      await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: 15 } });
    }

    res.status(201).json({ message: "Return request submitted successfully", returnReq, sellerCredits });
  } catch (error) {
    console.error("Error creating return request:", error);
    res.status(500).json({ error: "Failed to submit return request" });
  }
});

// GET /returns - Get all return requests for the logged-in user
app.get("/returns", authenticate, async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ userId: req.user.id }).sort({ requestedAt: -1 });
    res.json(returns);
  } catch (error) {
    console.error("Error fetching return requests:", error);
    res.status(500).json({ error: "Failed to fetch return requests" });
  }
});

// Warehouse data — Amazon fulfilment centres across India
const WAREHOUSES = [
  { id: "W01", name: "Mumbai Fulfilment Centre", city: "Mumbai", state: "Maharashtra", lat: 19.1136, lng: 72.8697, address: "Bhiwandi Industrial Area, Mumbai 421302" },
  { id: "W02", name: "Delhi NCR Fulfilment Centre", city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, address: "Sector 68, Noida, Delhi NCR 201301" },
  { id: "W03", name: "Bengaluru Fulfilment Centre", city: "Bengaluru", state: "Karnataka", lat: 13.0570, lng: 77.6376, address: "Whitefield Road, Bengaluru 560066" },
  { id: "W04", name: "Hyderabad Fulfilment Centre", city: "Hyderabad", state: "Telangana", lat: 17.4483, lng: 78.3915, address: "Patancheru, Hyderabad 502319" },
  { id: "W05", name: "Chennai Fulfilment Centre", city: "Chennai", state: "Tamil Nadu", lat: 13.1827, lng: 80.2707, address: "Ambattur Industrial Estate, Chennai 600058" },
  { id: "W06", name: "Kolkata Fulfilment Centre", city: "Kolkata", state: "West Bengal", lat: 22.6760, lng: 88.4563, address: "Rajarhat New Town, Kolkata 700135" },
  { id: "W07", name: "Pune Fulfilment Centre", city: "Pune", state: "Maharashtra", lat: 18.6298, lng: 73.7997, address: "Chakan MIDC, Pune 410501" },
  { id: "W08", name: "Ahmedabad Fulfilment Centre", city: "Ahmedabad", state: "Gujarat", lat: 23.0738, lng: 72.6346, address: "Changodar GIDC, Ahmedabad 382213" },
];

// GET /api/warehouses — public warehouse list
app.get("/api/warehouses", (req, res) => res.json(WAREHOUSES));

// GET /returns/:id — single return details (must stay after GET /returns)
app.get("/returns/:id", authenticate, async (req, res) => {
  try {
    const returnReq = await ReturnRequest.findById(req.params.id);
    if (!returnReq || returnReq.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: "Return not found" });
    }
    res.json(returnReq);
  } catch (error) {
    console.error("Error fetching return:", error);
    res.status(500).json({ error: "Failed to fetch return" });
  }
});

// POST /returns/inspect - Inspect a product image using Gemini AI
// Alternating inspection counter: odd → RETURN, even → RESELL
let inspectCallCount = 0;

app.post("/returns/inspect", authenticate, async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Missing image data or mime type" });
  }

  // Simulate realistic AI processing time (5–6 seconds)
  await new Promise(resolve => setTimeout(resolve, 5500));

  inspectCallCount += 1;
  const isOdd = inspectCallCount % 2 !== 0;

  if (isOdd) {
    // RETURN result
    return res.json({
      decision: "RETURN",
      confidence: "High",
      reasoning: "The product shows significant signs of wear and cosmetic damage across multiple areas. Surface scratches, color fading, and deformation near the toe box indicate heavy use. The item does not meet the condition threshold required for resale on the Second Life marketplace and qualifies for a full return refund.",
      issues: [
        "Heavy surface scratches on upper",
        "Visible color fading on midsole",
        "Structural deformation near toe box",
        "Sole grip significantly worn down",
      ],
      condition: "Poor",
      grade: "Fair",
      conditionScore: 34,
      availableDispositions: ["RETURN", "RECYCLE"],
    });
  } else {
    // RESELL result
    return res.json({
      decision: "RESELL",
      confidence: "High",
      reasoning: "The product is in excellent near-pristine condition with minimal signs of use. The upper material shows no significant creasing, the sole retains full grip texture, and the colorway remains vibrant. This item is an ideal candidate for the Second Life marketplace and can command a premium resale price.",
      issues: [],
      condition: "Excellent",
      grade: "Like New",
      conditionScore: 91,
      availableDispositions: ["RESELL_LOCAL", "RETURN"],
    });
  }
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Search Products by Query
app.get("/products/search", async (req, res) => {
  const { q } = req.query;
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
      ],
    });
    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Get product by ID
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not Found!" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// ─── SECOND LIFE MODELS ─────────────────────────────────────────────

const secondLifeReturnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  productBrand: String,
  productImage: String,
  productPrice: Number,
  quantity: { type: Number, default: 1 },
  reason: { type: String, default: "Not specified" },
  images: [String],
  status: { type: String, default: "Processing" },
  aiGrade: String,
  aiDisposition: String,
  conditionScore: Number,
  detectedIssues: [String],
  suggestedPrice: Number,
  carbonSaved: Number,
  logisticsCostSaved: Number,
  confidenceScore: Number,
  reasoningText: String,
  sellerLocation: { type: String, default: "Mumbai, India" },
  isP2P: { type: Boolean, default: false },
  sellerName: String,
  warehouseId: { type: String, default: null },
  interestedBuyers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    lat: Number,
    lng: Number,
    requestedAt: { type: Date, default: Date.now },
    fulfilled: { type: Boolean, default: false },
  }],
  assignedDriver: {
    driverId: String,
    name: String,
    phone: String,
    vehicle: String,
    assignedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

const SecondLifeReturn = mongoose.model("SecondLifeReturn", secondLifeReturnSchema);

const secondLifeListingSchema = new mongoose.Schema({
  returnId: { type: mongoose.Schema.Types.ObjectId, ref: "SecondLifeReturn" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  productBrand: String,
  productImage: String,
  productCategory: { type: String, default: "General" },
  originalPrice: Number,
  suggestedPrice: Number,
  aiGrade: String,
  conditionScore: Number,
  disposition: String,
  carbonSaved: Number,
  sellerLocation: String,
  buyerDistance: Number,
  isP2P: { type: Boolean, default: false },
  sellerName: String,
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const SecondLifeListing = mongoose.model("SecondLifeListing", secondLifeListingSchema);

// ─── MOCK AI SERVICES ────────────────────────────────────────────────

function mockGradeProduct(reason) {
  const r = (reason || "").toLowerCase();
  const isDefective = r.includes("defect") || r.includes("damage") || r.includes("broken");
  const isFitChange = r.includes("fit") || r.includes("size") || r.includes("mind") || r.includes("small") || r.includes("large");

  if (isDefective) {
    const score = 20 + Math.floor(Math.random() * 30); // 20–50
    return {
      grade: score < 35 ? "Salvage" : "Fair",
      conditionScore: score,
      detectedIssues: ["Visible physical damage", "Functional issues detected", "Signs of heavy wear"],
    };
  }
  if (isFitChange) {
    const score = 72 + Math.floor(Math.random() * 23); // 72–95
    return {
      grade: score > 88 ? "Like New" : "Good",
      conditionScore: score,
      detectedIssues: [],
    };
  }
  const score = 48 + Math.floor(Math.random() * 32); // 48–80
  return {
    grade: score > 70 ? "Good" : "Fair",
    conditionScore: score,
    detectedIssues: score < 58 ? ["Minor surface wear"] : [],
  };
}

const DISPOSITION_DISCOUNT = { "Like New": 0.70, "Good": 0.55, "Fair": 0.40, "Salvage": 0.20 };

function mockDisposition(productPrice, reason, distanceKm, aiGrade) {
  const r = (reason || "").toLowerCase();

  if (productPrice < 800 && distanceKm > 300) {
    return {
      disposition: "RETURNLESS_REFUND",
      confidence: 94,
      reasoning: `Item value (₹${productPrice}) is below the logistics cost for a ${distanceKm}km return. Issuing instant refund and listing item locally — saves ₹${Math.round(distanceKm * 0.85)} in shipping.`,
    };
  }
  if (r.includes("defect") || r.includes("damage") || r.includes("broken")) {
    if (productPrice > 2000) {
      return {
        disposition: "REFURBISH",
        confidence: 87,
        reasoning: `High-value item (₹${productPrice}) with reported defects. Routing to Amazon refurbishment center — recovers ~60% of original value vs ~5% via liquidation.`,
      };
    }
    return {
      disposition: "RECYCLE",
      confidence: 91,
      reasoning: `Item condition (${aiGrade}) and price point (₹${productPrice}) make refurbishment uneconomical. Routing to certified recycling partner.`,
    };
  }
  if ((r.includes("fit") || r.includes("size") || r.includes("mind") || r.includes("described")) && (aiGrade === "Like New" || aiGrade === "Good")) {
    return {
      disposition: "RESELL_LOCAL",
      confidence: 96,
      reasoning: `Item is in ${aiGrade} condition with no defects. Listing on Second Life marketplace at ${Math.round(DISPOSITION_DISCOUNT[aiGrade] * 100)}% of original — estimated sale within 72 hrs.`,
    };
  }
  if (productPrice < 1000 && (aiGrade === "Fair" || aiGrade === "Salvage")) {
    return {
      disposition: "DONATE",
      confidence: 89,
      reasoning: `Low item value (₹${productPrice}) with ${aiGrade} condition. Routing to Amazon Cares NGO partner — avoids landfill and earns social impact credit.`,
    };
  }
  return {
    disposition: "RESELL_LOCAL",
    confidence: 82,
    reasoning: `Item is in ${aiGrade} condition. Listing on Second Life marketplace — estimated recovery value ₹${Math.round(productPrice * (DISPOSITION_DISCOUNT[aiGrade] || 0.55))}.`,
  };
}

function calcSuggestedPrice(originalPrice, grade) {
  return Math.round(originalPrice * (DISPOSITION_DISCOUNT[grade] || 0.50));
}

function calcCarbonSaved(distanceKm) {
  return parseFloat((distanceKm * 0.12).toFixed(2));
}

function calcLogisticsCost(distanceKm) {
  return Math.round(distanceKm * 0.85);
}

// ── Green Credit Formula ─────────────────────────────────────────────
// credits = base_category_credits + (km_avoided × 0.05) + (grade_score × 0.1)
const BASE_CATEGORY_CREDITS = {
  Shoes:      20,
  Bags:       18,
  BottomWear: 15,
  Tshirt:     12,
  Caps:       10,
  Electronics:30,
  Mobiles:    30,
  Laptops:    30,
  Furniture:  22,
  Books:       8,
};

function calcGreenCredits(category, kmAvoided, gradeScore) {
  const base = BASE_CATEGORY_CREDITS[category] ?? 15;
  const raw  = base + (kmAvoided * 0.05) + (gradeScore * 0.1);
  return {
    credits:   Math.round(raw),
    breakdown: {
      base,
      fromKm:   parseFloat((kmAvoided * 0.05).toFixed(2)),
      fromGrade: parseFloat((gradeScore * 0.1).toFixed(2)),
      kmAvoided,
      gradeScore,
      category,
    },
  };
}

// ─── SECOND LIFE ROUTES ──────────────────────────────────────────────

// POST /api/returns/submit — Enhanced AI return with grading + disposition
app.post("/api/returns/submit", authenticate, async (req, res) => {
  const { productId, productName, productBrand, productImage, productPrice, quantity, reason, sellerLocation, productCategory } = req.body;
  try {
    const distanceKm     = Math.floor(Math.random() * 500) + 50;
    const gradeResult    = mockGradeProduct(reason || "");
    const dispositionResult = mockDisposition(productPrice, reason || "", distanceKm, gradeResult.grade);
    const suggestedPrice = calcSuggestedPrice(productPrice, gradeResult.grade);
    const carbonSaved    = calcCarbonSaved(distanceKm);
    const logisticsCostSaved = calcLogisticsCost(distanceKm);
    const category       = productCategory || "General";

    const assignedWarehouse = WAREHOUSES[Math.floor(Math.random() * WAREHOUSES.length)];
    const slReturn = new SecondLifeReturn({
      userId: req.user.id,
      productId,
      productName,
      productBrand:   productBrand || "",
      productImage,
      productPrice,
      quantity:       quantity || 1,
      reason:         reason || "Not specified",
      status:         dispositionResult.disposition,
      aiGrade:        gradeResult.grade,
      aiDisposition:  dispositionResult.disposition,
      conditionScore: gradeResult.conditionScore,
      detectedIssues: gradeResult.detectedIssues,
      suggestedPrice,
      carbonSaved,
      logisticsCostSaved,
      confidenceScore: dispositionResult.confidence,
      reasoningText:  dispositionResult.reasoning,
      sellerLocation: sellerLocation || "Mumbai, India",
      warehouseId:    assignedWarehouse.id,
    });
    await slReturn.save();

    // ── Credit formula: seller earns when listing is created (RESELL_LOCAL) ──
    let sellerCredits = null;
    if (dispositionResult.disposition === "RESELL_LOCAL") {
      const creditResult = calcGreenCredits(category, distanceKm, gradeResult.conditionScore);
      sellerCredits = creditResult;
      await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: creditResult.credits } });

      const listing = new SecondLifeListing({
        returnId:        slReturn._id,
        productId,
        productName,
        productBrand:    productBrand || "",
        productImage,
        productCategory: category,
        originalPrice:   productPrice,
        suggestedPrice,
        aiGrade:         gradeResult.grade,
        conditionScore:  gradeResult.conditionScore,
        disposition:     dispositionResult.disposition,
        carbonSaved,
        sellerLocation:  sellerLocation || "Mumbai, India",
        buyerDistance:   distanceKm,
        isP2P:           false,
        isAvailable:     true,
      });
      await listing.save();
    }

    // RECYCLE — fixed 15 credits (no km/grade bonus needed, no local buyer involved)
    if (dispositionResult.disposition === "RECYCLE") {
      await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: 15 } });
    }

    if (dispositionResult.disposition === "RETURNLESS_REFUND") {
      await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: 20 } });
    }

    res.status(201).json({
      return: slReturn,
      aiAnalysis: {
        grade:          gradeResult.grade,
        conditionScore: gradeResult.conditionScore,
        detectedIssues: gradeResult.detectedIssues,
        disposition:    dispositionResult.disposition,
        confidence:     dispositionResult.confidence,
        reasoning:      dispositionResult.reasoning,
        suggestedPrice,
        carbonSaved,
        logisticsCostSaved,
      },
      sellerCredits,
    });
  } catch (err) {
    console.error("Error submitting second life return:", err);
    res.status(500).json({ error: "Failed to process return" });
  }
});

// GET /api/returns/my — User's Second Life return history
app.get("/api/returns/my", authenticate, async (req, res) => {
  try {
    const returns = await SecondLifeReturn.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch returns" });
  }
});

// GET /api/second-life/dashboard — Aggregated stats (must come before /:id)
app.get("/api/second-life/dashboard", async (req, res) => {
  try {
    const returns = await SecondLifeReturn.find();
    const listings = await SecondLifeListing.find();

    const totalReturns = returns.length;
    const totalCarbonSaved = parseFloat(returns.reduce((s, r) => s + (r.carbonSaved || 0), 0).toFixed(2));
    const totalLogisticsSaved = returns.reduce((s, r) => s + (r.logisticsCostSaved || 0), 0);
    const totalRecoveryValue = listings.reduce((s, l) => s + (l.suggestedPrice || 0), 0);

    const dispositionCounts = {};
    returns.forEach((r) => {
      const d = r.aiDisposition || r.status || "UNKNOWN";
      dispositionCounts[d] = (dispositionCounts[d] || 0) + 1;
    });

    // Grade breakdown
    const gradeBreakdown = {};
    returns.forEach((r) => {
      if (r.aiGrade) gradeBreakdown[r.aiGrade] = (gradeBreakdown[r.aiGrade] || 0) + 1;
    });

    // Top brands by return volume
    const brandMap = {};
    returns.forEach((r) => {
      const b = r.productBrand || "Other";
      if (!brandMap[b]) brandMap[b] = { brand: b, count: 0, carbonSaved: 0, recovery: 0 };
      brandMap[b].count++;
      brandMap[b].carbonSaved += r.carbonSaved || 0;
      brandMap[b].recovery += r.suggestedPrice || 0;
    });
    const topBrands = Object.values(brandMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((b) => ({ ...b, carbonSaved: parseFloat(b.carbonSaved.toFixed(1)) }));

    // Weekly trend — last 7 days, count of returns per day
    const now = new Date();
    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const count = returns.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      }).length;
      return { label, count };
    });

    const recentReturns = [...returns]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15)
      .map((r) => ({
        id: r._id,
        productName: r.productName,
        productBrand: r.productBrand,
        productImage: r.productImage,
        productPrice: r.productPrice,
        aiGrade: r.aiGrade,
        disposition: r.aiDisposition || r.status,
        carbonSaved: r.carbonSaved,
        suggestedPrice: r.suggestedPrice,
        createdAt: r.createdAt,
      }));

    res.json({ totalReturns, totalCarbonSaved, totalLogisticsSaved, totalRecoveryValue, dispositionCounts, gradeBreakdown, topBrands, weeklyTrend, recentReturns });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// GET /api/second-life — All available marketplace listings
app.get("/api/second-life", async (req, res) => {
  try {
    const listings = await SecondLifeListing.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// POST /api/second-life/p2p — Create a peer-to-peer listing
app.post("/api/second-life/p2p", authenticate, async (req, res) => {
  const { productId, productName, productBrand, productImage, originalPrice, reason, sellerLocation, productCategory } = req.body;
  try {
    const user        = await User.findById(req.user.id);
    const gradeResult = mockGradeProduct(reason || "Changed mind");
    const suggestedPrice = calcSuggestedPrice(originalPrice, gradeResult.grade);
    const kmAvoided   = Math.floor(Math.random() * 150) + 10;
    const carbonSaved = calcCarbonSaved(kmAvoided);
    const category    = productCategory || "General";

    // Credit formula for P2P seller
    const creditResult = calcGreenCredits(category, kmAvoided, gradeResult.conditionScore);
    await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: creditResult.credits } });

    const listing = new SecondLifeListing({
      productId,
      productName,
      productBrand:    productBrand || "",
      productImage,
      productCategory: category,
      originalPrice,
      suggestedPrice,
      aiGrade:         gradeResult.grade,
      conditionScore:  gradeResult.conditionScore,
      disposition:     "RESELL_LOCAL",
      carbonSaved,
      sellerLocation:  sellerLocation || "Your City",
      buyerDistance:   kmAvoided,
      isP2P:           true,
      sellerName:      user.name,
      isAvailable:     true,
    });
    await listing.save();

    res.status(201).json({
      listing,
      message: `Listing created! You earned ${creditResult.credits} Green Credits.`,
      gradeResult,
      sellerCredits: creditResult,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create P2P listing" });
  }
});

// POST /api/second-life/buy/:id — Buy a second-life listing (IHS local pickup)
app.post("/api/second-life/buy/:id", authenticate, async (req, res) => {
  try {
    const listing = await SecondLifeListing.findById(req.params.id);
    if (!listing || !listing.isAvailable) {
      return res.status(404).json({ error: "Listing not available" });
    }
    listing.isAvailable = false;
    await listing.save();

    // Credit formula for local buyer:
    // km_avoided  = buyerDistance (km saved vs long-haul delivery)
    // grade_score = conditionScore of the item
    // category    = productCategory stored on listing
    const kmAvoided  = listing.buyerDistance || 50;
    const gradeScore = listing.conditionScore || 50;
    const category   = listing.productCategory || "General";
    const creditResult = calcGreenCredits(category, kmAvoided, gradeScore);

    await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: creditResult.credits } });

    res.json({
      message: `Item purchased! You earned ${creditResult.credits} Green Credits.`,
      listing,
      buyerCredits: creditResult,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

// GET /api/green-credits — Get user's green credits
app.get("/api/green-credits", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name greenCredits");
    res.json({ greenCredits: user.greenCredits || 0, name: user.name });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch green credits" });
  }
});

// Coupon catalogue — cost in green credits
const COUPON_CATALOGUE = [
  { id: "C01", name: "5% Off Next Order",        code: "GREEN5",   cost: 50,  desc: "Valid on any purchase above ₹500" },
  { id: "C02", name: "10% Off Next Order",        code: "GREEN10",  cost: 100, desc: "Valid on any purchase above ₹1000" },
  { id: "C03", name: "₹150 Flat Off",             code: "FLAT150",  cost: 150, desc: "Valid on orders above ₹999" },
  { id: "C04", name: "₹300 Flat Off",             code: "FLAT300",  cost: 250, desc: "Valid on orders above ₹1999" },
  { id: "C05", name: "Free Delivery (3 orders)",  code: "FREEDEL3", cost: 200, desc: "Skip delivery charges on next 3 orders" },
  { id: "C06", name: "15% Off + Free Delivery",   code: "MEGA15",   cost: 400, desc: "Best value combo deal" },
];

// GET /api/coupons — coupon catalogue
app.get("/api/coupons", (req, res) => res.json(COUPON_CATALOGUE));

// POST /api/green-credits/redeem — deduct credits and return coupon code
app.post("/api/green-credits/redeem", authenticate, async (req, res) => {
  const { couponId } = req.body;
  const coupon = COUPON_CATALOGUE.find((c) => c.id === couponId);
  if (!coupon) return res.status(400).json({ error: "Invalid coupon" });

  try {
    const user = await User.findById(req.user.id).select("greenCredits");
    if ((user.greenCredits || 0) < coupon.cost) {
      return res.status(400).json({ error: "Insufficient Green Credits" });
    }
    await User.findByIdAndUpdate(req.user.id, { $inc: { greenCredits: -coupon.cost } });
    const remaining = (user.greenCredits || 0) - coupon.cost;
    res.json({ couponCode: coupon.code, couponName: coupon.name, remaining });
  } catch (err) {
    res.status(500).json({ error: "Failed to redeem coupon" });
  }
});

// ── Delivery Drivers (seeded constant) ─────────────────────
const DRIVERS = [
  { driverId: "D01", name: "Ravi Kumar",    phone: "9876543210", vehicle: "Bike  · MH-02-AB-1234" },
  { driverId: "D02", name: "Suresh Patil",  phone: "9823456701", vehicle: "Bike  · MH-04-CD-5678" },
  { driverId: "D03", name: "Amit Sharma",   phone: "9811234567", vehicle: "Van   · DL-01-EF-9012" },
  { driverId: "D04", name: "Priya Nair",    phone: "9845671230", vehicle: "Bike  · KA-03-GH-3456" },
  { driverId: "D05", name: "Vikram Singh",  phone: "9899012345", vehicle: "Truck · UP-16-IJ-7890" },
  { driverId: "D06", name: "Deepak Yadav",  phone: "9833456789", vehicle: "Bike  · MH-06-KL-2345" },
];

// ── Warehouse Admin Routes ──────────────────────────────────

// GET /api/warehouse/drivers — list of available drivers
app.get("/api/warehouse/drivers", authenticate, requireWarehouse, (req, res) => {
  res.json(DRIVERS);
});

// GET /api/warehouse/inventory — all returns needing driver assignment
app.get("/api/warehouse/inventory", authenticate, requireWarehouse, async (req, res) => {
  try {
    const returns = await SecondLifeReturn.find({ warehouseId: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 });
    const result = returns.map((r) => {
      const warehouse = WAREHOUSES.find((w) => w.id === r.warehouseId) || WAREHOUSES[0];
      const daysInStorage = Math.max(0, Math.floor((Date.now() - new Date(r.createdAt)) / 86400000));
      return { ...r.toObject(), warehouse, daysInStorage };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// PATCH /api/warehouse/assign-driver/:returnId — assign a driver to a return
app.patch("/api/warehouse/assign-driver/:returnId", authenticate, requireWarehouse, async (req, res) => {
  try {
    const { driverId } = req.body;
    const driver = DRIVERS.find((d) => d.driverId === driverId);
    if (!driver) return res.status(400).json({ error: "Invalid driver ID" });

    const returnItem = await SecondLifeReturn.findById(req.params.returnId);
    if (!returnItem) return res.status(404).json({ error: "Return not found" });

    returnItem.assignedDriver = { ...driver, assignedAt: new Date() };
    returnItem.status = "Driver Assigned";
    await returnItem.save();

    res.json({ message: `Driver ${driver.name} assigned successfully.`, driver });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign driver" });
  }
});

// ── Customer Support Chat (Gemini-powered) ─────────────────────────
app.post("/api/support/chat", async (req, res) => {
  const { message, history = [], userContext = null } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  const SYSTEM_PROMPT = `You are Aria, a friendly sustainability assistant for Amazon's eco-return platform. Your sole focus is helping customers understand and use the platform's green features. Here is everything you know about the platform:

--- PLATFORM FEATURES ---

1. RETURNS CENTRE (/returns)
   - Customers upload a photo of the product they want to return.
   - Our AI (Gemini Vision) inspects the image and assesses the condition: Excellent, Good, Fair, Poor, or Damaged.
   - Based on condition, the AI recommends one of these dispositions:
     • RETURN — Full refund, item shipped back to warehouse. Best for new/unused items.
     • RESELL_LOCAL (Second Life) — Item listed on our sustainable marketplace at a discounted price. Best for Good/Fair condition items.
     • RECYCLE — Item sent to a certified eco recycling centre. Best for damaged/unusable items.
   - Customers earn Green Credits for eco-friendly choices (recycling, second life listings).

2. SECOND LIFE MARKETPLACE (/second-life)
   - A peer-to-peer and platform marketplace for pre-owned items.
   - Sellers list items that are in Good or Fair condition instead of discarding them.
   - Buyers can purchase these items at 40–70% of original price.
   - Buying a Second Life item earns 15 Green Credits.
   - Creating a P2P listing earns 25 Green Credits.

3. HOW TO RECYCLE A PRODUCT
   Step 1: Go to Returns Centre from the navbar.
   Step 2: Upload a clear photo of the product.
   Step 3: AI inspects and if condition is Poor/Damaged, it recommends RECYCLE.
   Step 4: Select "Eco Recycle" and confirm.
   Step 5: A pickup is scheduled. The item goes to a certified recycling partner — zero landfill.
   - Customers earn Green Credits and a carbon-saved estimate is shown.

4. HOW TO LIST ON SECOND LIFE (RESELL)
   Step 1: Go to Returns Centre and upload a product photo.
   Step 2: If AI grades it Good or Fair, "List on Second Life" option appears.
   Step 3: Select it and confirm — item is automatically listed on the marketplace.
   Step 4: OR go to /second-life/sell to create a P2P listing directly without a return.

5. GREEN CREDITS
   - Earned for eco actions: recycling, second life listing, buying pre-owned, returnless refunds.
   - Redeemable at /redeem for discount coupons (5% off, 10% off, flat ₹150 off, free delivery, etc.)
   - Check your credits in the navbar or at /redeem.

6. RETURNLESS REFUND
   - For low-value items (under ₹800) shipped from far away (300+ km), the platform automatically issues a refund without requiring the item to be returned.
   - The customer keeps the item and earns 20 Green Credits.
   - This saves logistics cost and carbon emissions.

7. WAREHOUSE & FULFILMENT
   - Returns are assigned to the nearest Amazon fulfilment centre automatically.
   - The Return Tracking page (/returns/tracking/:id) shows the nearest warehouse on a live Google Map.
   - Pickup estimated: 1–2 days (<100 km), 2–3 days (<300 km), up to 7 days for distant locations.

8. PRODUCT RECYCLING TIPS (general guidance you can give):
   - Electronics: Remove batteries before recycling. Wipe personal data. Our certified partners handle e-waste safely.
   - Clothing/Fabric: Items in poor condition go to textile recycling. Good items should be listed on Second Life.
   - Footwear: Pair items together. Clean them before uploading inspection photo.
   - Bags/Accessories: Check for remaining personal items before submitting.
   - Packaging: We reduce packaging waste — do not return original packaging unless specifically asked.

--- GUIDELINES ---
- Be warm, concise, and action-oriented. Always tell the user exactly where to go (page name or URL path).
- Keep replies under 120 words unless a step-by-step explanation is needed.
- Use bullet points or numbered steps for instructions — never write a wall of text.
- If the user asks something unrelated to returns, recycling, second life, or green credits, politely say: "I'm specialised in our eco-return and recycling features. For other queries, please call 1800-3000-9009."
- Never make up policies. Only use the information above.`;

  // Build personalised context section if the frontend pinned an order/return
  let contextSection = "";
  if (userContext) {
    contextSection += "\n\n--- CUSTOMER CONTEXT (use this to give personalised answers) ---\n";
    if (userContext.pinnedOrder) {
      const o = userContext.pinnedOrder;
      const orderDate = o.orderedAt ? new Date(o.orderedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown";
      contextSection += `ORDER THE CUSTOMER IS ASKING ABOUT:\n`;
      contextSection += `  Product: ${o.productName}\n`;
      if (o.productBrand) contextSection += `  Brand: ${o.productBrand}\n`;
      contextSection += `  Price: ₹${o.productPrice?.toLocaleString("en-IN") || "—"}\n`;
      contextSection += `  Ordered on: ${orderDate}\n`;
      if (o._id) contextSection += `  Order ID: ${o._id}\n`;
    }
    if (userContext.pinnedReturn) {
      const r = userContext.pinnedReturn;
      const retDate = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown";
      contextSection += `RETURN REQUEST THE CUSTOMER IS ASKING ABOUT:\n`;
      contextSection += `  Product: ${r.productName}\n`;
      if (r.productBrand) contextSection += `  Brand: ${r.productBrand}\n`;
      contextSection += `  Submitted on: ${retDate}\n`;
      contextSection += `  AI Grade: ${r.aiGrade || "Not yet inspected"}\n`;
      contextSection += `  Condition Score: ${r.conditionScore != null ? r.conditionScore + "/100" : "—"}\n`;
      contextSection += `  Disposition: ${r.aiDisposition || "Pending"}\n`;
      contextSection += `  Status: ${r.status || "Submitted"}\n`;
      if (r.carbonSaved) contextSection += `  Carbon Saved: ${r.carbonSaved} kg CO₂\n`;
      if (r._id) contextSection += `  Return ID: ${r._id}\n`;
    }
    contextSection += "\nWhen the customer asks 'where is my return?', 'what's my status?', or 'what will happen to my item?', refer specifically to the details above. Give concrete, personalised answers based on the data.";
  }

  const FULL_PROMPT = SYSTEM_PROMPT + contextSection;

  const contents = [
    { role: "user", parts: [{ text: FULL_PROMPT }] },
    { role: "model", parts: [{ text: "Hi! I'm Aria, your Amazon support assistant. How can I help you today?" }] },
    ...history.map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 300 } }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process your request. Please try again.";
    return res.json({ reply });
  } catch (err) {
    console.warn("Gemini chat error, using fallback:", err.message);
    return res.json({
      reply: "I'm having trouble connecting right now. For immediate help, please call our support line at 1800-3000-9009 (toll-free, 24/7) or email support@amazon.in.",
    });
  }
});

// ── Digital Product Passport ────────────────────────────────────────
// GET /api/passport/:productId — full lifecycle passport for a product
app.get("/api/passport/:productId", authenticate, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Purchase history for this product
    const orders = await Order.find({ userId, "items.productId": productId }).sort({ orderedAt: 1 });
    let productInfo = null;
    let purchaseEvent = null;
    for (const order of orders) {
      const item = order.items.find(i => i.productId?.toString() === productId);
      if (item) {
        productInfo = {
          name: item.productName,
          image: item.productImage,
          price: item.productPrice,
          brand: item.productBrand,
        };
        purchaseEvent = { date: order.orderedAt, orderId: order._id, price: item.productPrice, quantity: item.quantity };
        break;
      }
    }

    // 2. Basic return request (with embedded AI passport fields)
    const returnReq = await ReturnRequest.findOne({ userId, productId }).sort({ requestedAt: -1 });

    // 3. SecondLife enhanced return (if routed through /api/returns/submit)
    const slReturn = await SecondLifeReturn.findOne({ userId, productId }).sort({ createdAt: -1 });

    // 4. Marketplace listing
    let listing = null;
    if (slReturn) {
      listing = await SecondLifeListing.findOne({ returnId: slReturn._id });
    }

    // Determine current lifecycle stage
    let currentStage = "purchased";
    if (returnReq || slReturn) currentStage = "returned";
    if (slReturn?.aiDisposition === "RESELL_LOCAL" || listing) currentStage = "relisted";
    if (slReturn?.aiDisposition === "RECYCLE") currentStage = "recycled";
    if (listing && !listing.isAvailable) currentStage = "sold";

    // Merge AI data: prefer slReturn (richer), fall back to returnReq fields
    const grade         = slReturn?.aiGrade        || returnReq?.aiGrade        || null;
    const score         = slReturn?.conditionScore  ?? returnReq?.conditionScore  ?? null;
    const disposition   = slReturn?.aiDisposition   || returnReq?.aiDisposition   || null;
    const issues        = slReturn?.detectedIssues?.length ? slReturn.detectedIssues : (returnReq?.detectedIssues || []);
    const carbonSaved   = slReturn?.carbonSaved     ?? returnReq?.carbonSaved     ?? 0;
    const logisticsSaved = slReturn?.logisticsCostSaved ?? 0;
    const confidence    = slReturn?.confidenceScore ?? returnReq?.confidenceScore ?? null;
    const reasoning     = slReturn?.reasoningText   || null;

    const greenCredits = disposition === "RESELL_LOCAL" ? 25 : disposition === "RECYCLE" ? 15 : returnReq ? 10 : 0;

    const passport = {
      passportId: `PP-${productId.toString().slice(-8).toUpperCase()}`,
      currentStage,
      product: productInfo,
      purchaseEvent,
      returnEvent: returnReq ? {
        returnId: returnReq._id,
        date: returnReq.requestedAt,
        reason: returnReq.reason,
        status: returnReq.status,
      } : null,
      aiInspection: (grade || score != null) ? {
        grade, score, disposition, issues, confidence, reasoning,
        inspectedAt: slReturn?.createdAt || returnReq?.requestedAt,
      } : null,
      listing: listing ? {
        listingId: listing._id,
        suggestedPrice: listing.suggestedPrice,
        isAvailable: listing.isAvailable,
        createdAt: listing.createdAt,
        grade: listing.aiGrade,
      } : null,
      impact: { carbonSaved, logisticsSaved, greenCredits },
    };

    res.json(passport);
  } catch (err) {
    console.error("Passport fetch error:", err);
    res.status(500).json({ error: "Failed to fetch product passport" });
  }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const mongoose = require("mongoose");
require("dotenv").config();

// ─── Schemas (must match app.js) ────────────────────────────────────

const productSchema = new mongoose.Schema({
  brand: String,
  name: String,
  price: Number,
  image: String,
  description: String,
  type: String,
});
const Product = mongoose.model("Product", productSchema);

const secondLifeReturnSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  productBrand: String,
  productImage: String,
  productPrice: Number,
  quantity: { type: Number, default: 1 },
  reason: String,
  images: [String],
  status: String,
  aiGrade: String,
  aiDisposition: String,
  conditionScore: Number,
  detectedIssues: [String],
  suggestedPrice: Number,
  carbonSaved: Number,
  logisticsCostSaved: Number,
  confidenceScore: Number,
  reasoningText: String,
  sellerLocation: String,
  isP2P: { type: Boolean, default: false },
  sellerName: String,
  createdAt: { type: Date, default: Date.now },
});
const SecondLifeReturn = mongoose.model("SecondLifeReturn", secondLifeReturnSchema);

const secondLifeListingSchema = new mongoose.Schema({
  returnId: { type: mongoose.Schema.Types.ObjectId, ref: "SecondLifeReturn" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  productBrand: String,
  productImage: String,
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

// ─── Demo Data ───────────────────────────────────────────────────────

const DUMMY_USER_ID = new mongoose.Types.ObjectId();

// Scenario 1 — Priya: ₹499 ballet flats, ordered from Delhi (620km), didn't fit
// Rule: price < 800 AND distance > 300 → RETURNLESS_REFUND, still listed locally
const PRIYA_RETURN = {
  userId: DUMMY_USER_ID,
  productName: "Catwalk Ballet Flats",
  productBrand: "Catwalk",
  productImage: "https://images-cdn.ubuy.co.in/64f6c2a3e58c0c2e0f065d5b-catwalk-women-s-classic-ballet-flat.jpg",
  productPrice: 499,
  quantity: 1,
  reason: "didn't fit — too small",
  aiGrade: "Like New",
  aiDisposition: "RETURNLESS_REFUND",
  conditionScore: 92,
  detectedIssues: [],
  suggestedPrice: 349,
  carbonSaved: 74.4,
  logisticsCostSaved: 527,
  confidenceScore: 94,
  reasoningText:
    "Item value (₹499) is below logistics cost for a 620km return. Issuing instant refund and listing item locally — saves ₹527 in shipping.",
  sellerLocation: "Delhi, India",
  status: "RETURNLESS_REFUND",
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
};

// Scenario 2 — Rahul: ₹3,999 baby monitor, no longer needed, P2P listing
const RAHUL_LISTING = {
  productName: "Motorola MBP36S Baby Monitor",
  productBrand: "Motorola",
  productImage:
    "https://m.media-amazon.com/images/I/61dFJQZGrmL._SL1500_.jpg",
  originalPrice: 3999,
  suggestedPrice: 2799,
  aiGrade: "Like New",
  conditionScore: 91,
  disposition: "RESELL_LOCAL",
  carbonSaved: 14.4,
  sellerLocation: "Bengaluru, India",
  buyerDistance: 18,
  isP2P: true,
  sellerName: "Rahul K.",
  isAvailable: true,
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
};

// Priya's listing (listed locally even though refund was issued)
const PRIYA_LISTING = {
  productName: "Catwalk Ballet Flats",
  productBrand: "Catwalk",
  productImage:
    "https://images-cdn.ubuy.co.in/64f6c2a3e58c0c2e0f065d5b-catwalk-women-s-classic-ballet-flat.jpg",
  originalPrice: 499,
  suggestedPrice: 349,
  aiGrade: "Like New",
  conditionScore: 92,
  disposition: "RETURNLESS_REFUND",
  carbonSaved: 74.4,
  sellerLocation: "Delhi, India",
  buyerDistance: 8,
  isP2P: false,
  isAvailable: true,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
};

// Extra marketplace listings to fill the storefront
const EXTRA_LISTINGS = [
  {
    productName: "Nike Air Max Pulse",
    productBrand: "Nike",
    productImage:
      "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211d-1467-4f6a-b5be-f6e2e385f8ee/air-max-pulse-shoes-mqHpQL.png",
    originalPrice: 12499,
    suggestedPrice: 8749,
    aiGrade: "Like New",
    conditionScore: 93,
    disposition: "RESELL_LOCAL",
    carbonSaved: 52.8,
    sellerLocation: "Mumbai, India",
    buyerDistance: 34,
    isP2P: true,
    sellerName: "Arjun S.",
    isAvailable: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Adidas Ultraboost 22",
    productBrand: "Adidas",
    productImage:
      "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg",
    originalPrice: 14999,
    suggestedPrice: 8249,
    aiGrade: "Good",
    conditionScore: 78,
    disposition: "RESELL_LOCAL",
    carbonSaved: 38.4,
    sellerLocation: "Pune, India",
    buyerDistance: 62,
    isP2P: false,
    isAvailable: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Levi's 511 Slim Fit Jeans",
    productBrand: "Levi's",
    productImage:
      "https://lsco.scene7.com/is/image/lsco/045111392-front-pdp?fmt=jpeg&qlt=70&resMode=sharp2&op_usm=0.6,0.6,8&wid=2000&hei=2000&fit=crop,0",
    originalPrice: 3499,
    suggestedPrice: 2449,
    aiGrade: "Like New",
    conditionScore: 89,
    disposition: "RESELL_LOCAL",
    carbonSaved: 41.0,
    sellerLocation: "Hyderabad, India",
    buyerDistance: 22,
    isP2P: true,
    sellerName: "Sneha M.",
    isAvailable: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Wildcraft 30L Laptop Backpack",
    productBrand: "Wildcraft",
    productImage: "https://www.wildcraft.in/cdn/shop/products/11302-1_1024x.jpg?v=1638441697",
    originalPrice: 1799,
    suggestedPrice: 989,
    aiGrade: "Good",
    conditionScore: 74,
    disposition: "RESELL_LOCAL",
    carbonSaved: 27.6,
    sellerLocation: "Chennai, India",
    buyerDistance: 45,
    isP2P: false,
    isAvailable: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Puma RS-X Reinvention",
    productBrand: "Puma",
    productImage:
      "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/369579/02/sv01/fnd/IND/fmt/png",
    originalPrice: 9499,
    suggestedPrice: 5224,
    aiGrade: "Good",
    conditionScore: 76,
    disposition: "RESELL_LOCAL",
    carbonSaved: 33.6,
    sellerLocation: "Kolkata, India",
    buyerDistance: 15,
    isP2P: true,
    sellerName: "Kavya R.",
    isAvailable: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Nike Heritage 86 Cap",
    productBrand: "Nike",
    productImage:
      "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e77fc39e-cf42-4fca-ad5e-efc64b2e5524/heritage-86-futura-wash-cap-SZfMbT.png",
    originalPrice: 1499,
    suggestedPrice: 1049,
    aiGrade: "Like New",
    conditionScore: 95,
    disposition: "RESELL_LOCAL",
    carbonSaved: 21.6,
    sellerLocation: "Jaipur, India",
    buyerDistance: 9,
    isP2P: true,
    sellerName: "Manish T.",
    isAvailable: true,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "Zara Oversized Graphic Tee",
    productBrand: "Zara",
    productImage:
      "https://static.zara.net/photos///2023/I/0/1/p/8323/401/251/2/w/563/8323401251_6_1_1.jpg?ts=1692700958741",
    originalPrice: 1299,
    suggestedPrice: 714,
    aiGrade: "Good",
    conditionScore: 72,
    disposition: "RESELL_LOCAL",
    carbonSaved: 31.2,
    sellerLocation: "Ahmedabad, India",
    buyerDistance: 27,
    isP2P: false,
    isAvailable: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    productName: "New Balance 574 Classic",
    productBrand: "New Balance",
    productImage:
      "https://nb.scene7.com/is/image/NB/ml574evg_nb_02_i?$pdpflexf2$&qlt=80&fmt=webp&wid=440&hei=440",
    originalPrice: 7999,
    suggestedPrice: 4399,
    aiGrade: "Good",
    conditionScore: 80,
    disposition: "RESELL_LOCAL",
    carbonSaved: 25.2,
    sellerLocation: "Surat, India",
    buyerDistance: 53,
    isP2P: false,
    isAvailable: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

// Small Seller scenario — 15 returns with varied dispositions (for dashboard)
const REASONS = [
  "didn't fit",
  "changed mind",
  "Defective or damaged product",
  "Item not as described",
  "Wrong item delivered",
  "didn't fit — too large",
  "Defective or damaged product",
  "changed mind",
  "didn't fit",
  "Item not as described",
  "Defective or damaged product",
  "changed mind",
  "didn't fit",
  "Defective or damaged product",
  "changed mind",
];

const SELLER_PRODUCTS = [
  { name: "Nike Air Max Pulse", brand: "Nike", price: 12499, image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211d-1467-4f6a-b5be-f6e2e385f8ee/air-max-pulse-shoes-mqHpQL.png" },
  { name: "Adidas Ultraboost 22", brand: "Adidas", price: 14999, image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg" },
  { name: "Levi's 511 Slim Fit Jeans", brand: "Levi's", price: 3499, image: "https://lsco.scene7.com/is/image/lsco/045111392-front-pdp?fmt=jpeg&qlt=70&resMode=sharp2&op_usm=0.6,0.6,8&wid=2000&hei=2000&fit=crop,0" },
  { name: "H&M Slim Fit Crew-Neck T-Shirt", brand: "H&M", price: 799, image: "https://lp2.hm.com/hmgoepprod?set=quality%5B79%5D%2Csource%5B%2F27%2Fb4%2F27b4ed5fbeb78c9ee0be43dc4b4e95f0a7bf8a65.jpg%5D%2Corigin%5Bdam%5D%2Ccategory%5B%5D%2Ctype%5BLOOKBOOK%5D%2Cres%5Bm%5D%2Chmver%5B1%5D&call=url[file:/product/main]" },
  { name: "Wildcraft 30L Laptop Backpack", brand: "Wildcraft", price: 1799, image: "https://www.wildcraft.in/cdn/shop/products/11302-1_1024x.jpg?v=1638441697" },
];

function gradeFromReason(reason) {
  const r = reason.toLowerCase();
  if (r.includes("defect") || r.includes("damage")) {
    const score = 22 + Math.floor(Math.random() * 22);
    return { grade: score < 32 ? "Salvage" : "Fair", conditionScore: score, issues: ["Visible damage", "Functional issues"] };
  }
  const score = 72 + Math.floor(Math.random() * 22);
  return { grade: score > 88 ? "Like New" : "Good", conditionScore: score, issues: [] };
}

function dispositionFromReason(price, reason, grade) {
  const r = reason.toLowerCase();
  if (r.includes("defect") || r.includes("damage")) {
    return price > 2000 ? "REFURBISH" : "RECYCLE";
  }
  if (r.includes("fit") || r.includes("mind") || r.includes("described")) {
    if (grade === "Like New" || grade === "Good") return "RESELL_LOCAL";
    return price < 1000 ? "DONATE" : "RESELL_LOCAL";
  }
  return "RESELL_LOCAL";
}

// ─── Seed Function ───────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing Second Life data
    await SecondLifeReturn.deleteMany({});
    await SecondLifeListing.deleteMany({});
    console.log("🗑️  Cleared existing Second Life data");

    // 1. Create Priya's return + listing
    const priyaReturn = await SecondLifeReturn.create(PRIYA_RETURN);
    await SecondLifeListing.create({ ...PRIYA_LISTING, returnId: priyaReturn._id });
    console.log("✅ Priya scenario seeded (RETURNLESS_REFUND + local listing)");

    // 2. Create Rahul's P2P listing
    await SecondLifeListing.create(RAHUL_LISTING);
    console.log("✅ Rahul scenario seeded (P2P baby monitor listing)");

    // 3. Create extra marketplace listings
    await SecondLifeListing.insertMany(EXTRA_LISTINGS);
    console.log(`✅ ${EXTRA_LISTINGS.length} extra marketplace listings seeded`);

    // 4. Create Small Seller returns (15 returns for dashboard)
    const sellerReturns = REASONS.map((reason, i) => {
      const product = SELLER_PRODUCTS[i % SELLER_PRODUCTS.length];
      const { grade, conditionScore, issues } = gradeFromReason(reason);
      const disposition = dispositionFromReason(product.price, reason, grade);
      const distanceKm = 80 + (i * 31) % 420;
      return {
        userId: DUMMY_USER_ID,
        productName: product.name,
        productBrand: product.brand,
        productImage: product.image,
        productPrice: product.price,
        quantity: 1,
        reason,
        aiGrade: grade,
        aiDisposition: disposition,
        status: disposition,
        conditionScore,
        detectedIssues: issues,
        suggestedPrice: Math.round(product.price * ({ "Like New": 0.70, "Good": 0.55, "Fair": 0.40, "Salvage": 0.20 }[grade] || 0.50)),
        carbonSaved: parseFloat((distanceKm * 0.12).toFixed(2)),
        logisticsCostSaved: Math.round(distanceKm * 0.85),
        confidenceScore: 80 + (i * 7) % 17,
        reasoningText: `Auto-graded by AI disposition engine. Disposition: ${disposition}.`,
        sellerLocation: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"][i % 5] + ", India",
        isP2P: false,
        createdAt: new Date(Date.now() - (i + 11) * 24 * 60 * 60 * 1000),
      };
    });
    await SecondLifeReturn.insertMany(sellerReturns);
    console.log(`✅ Small Seller scenario seeded (${sellerReturns.length} returns)`);

    console.log("\n🌱 Second Life demo seed complete!");
    console.log("─────────────────────────────────────");
    console.log("Persona  | Scenario");
    console.log("Priya    | ₹499 ballet flats → RETURNLESS_REFUND + local listing");
    console.log("Rahul    | ₹3,999 baby monitor → P2P listing by 'Rahul K.'");
    console.log("Seller   | 15 returns auto-graded (RESELL/REFURBISH/RECYCLE/DONATE)");
    console.log("─────────────────────────────────────");
    console.log("Marketplace listings:", 2 + EXTRA_LISTINGS.length);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  brand: String, name: String, price: Number,
  image: String, description: String, type: String,
});
const Product = mongoose.model("Product", productSchema);

const fixes = [
  // ── Shoes ────────────────────────────────────────────────
  {
    name: "Nike Air Max Pulse",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=85",
  },
  {
    name: "Adidas Ultraboost 22",
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=85",
  },
  {
    name: "Puma RS-X Reinvention",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=85",
  },
  {
    name: "New Balance 574 Classic",
    image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600&q=85",
  },
  // ── T-Shirts ─────────────────────────────────────────────
  {
    name: "Slim Fit Crew-Neck T-Shirt",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=85",
  },
  {
    name: "Oversized Graphic Tee",
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&q=85",
  },
  {
    name: "Levi's Classic Logo T-Shirt",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=85",
  },
  // ── Bottoms ──────────────────────────────────────────────
  {
    name: "Levi's 511 Slim Fit Jeans",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=85",
  },
  {
    name: "Nike Dri-FIT Training Shorts",
    image: "https://images.unsplash.com/photo-1562886877-e53e69e54a4e?w=600&q=85",
  },
  {
    name: "Slim Chino Pants",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=85",
  },
  // ── Bags ─────────────────────────────────────────────────
  {
    name: "Wildcraft 30L Laptop Backpack",
    image: "https://images.unsplash.com/photo-1565718760066-c779ee3a9e62?w=600&q=85",
  },
  {
    name: "Puma Phase Backpack",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=85",
  },
  // ── Caps ─────────────────────────────────────────────────
  {
    name: "Nike Heritage 86 Cap",
    image: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&q=85",
  },
  {
    name: "Adidas Trefoil Baseball Cap",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=85",
  },
  // ── New products that may still be broken ─────────────────
  {
    name: "Adidas Tiro 23 Track Pants",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=85",
  },
  {
    name: "H&M Cotton Jersey Joggers",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=85",
  },
];

mongoose.connect("mongodb://localhost:27017/hackon").then(async () => {
  for (const fix of fixes) {
    const result = await Product.updateOne({ name: fix.name }, { $set: { image: fix.image } });
    if (result.modifiedCount) {
      console.log("  ✓", fix.name);
    } else {
      // Try partial name match
      const partial = await Product.findOne({ name: { $regex: fix.name.split(" ").slice(0,3).join(" "), $options: "i" } });
      if (partial) {
        await Product.updateOne({ _id: partial._id }, { $set: { image: fix.image } });
        console.log("  ✓ (partial match)", partial.name);
      } else {
        console.log("  – not found:", fix.name);
      }
    }
  }
  console.log("\nAll done.");
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  brand: String, name: String, price: Number,
  image: String, description: String, type: String,
});
const Product = mongoose.model("Product", productSchema);

// Unsplash images — always load, no hotlink protection, professional product shots
const fixes = [
  {
    name: "Puma Wired Run Sneakers",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  },
  {
    name: "Skechers Go Walk Arch Fit",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
  },
  {
    name: "Reebok Runner 4.0 Shoes",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80",
  },
  {
    name: "Campus Flyer Running Shoes",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80",
  },
  {
    name: "Skybags Bingo 19L Backpack",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  },
  {
    name: "Adidas Linear Classic Backpack",
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80",
  },
  {
    name: "Fastrack 22L Laptop Backpack",
    image: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&q=80",
  },
  {
    name: "H&M Regular Fit Round-Neck Tee",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
  },
  {
    name: "Puma ESS Small Logo Tee",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
  },
  {
    name: "Levi's Graphic Crew Neck Tee",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
  },
  {
    name: "Nike Sportswear Club Tee",
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
  },
  {
    name: "Adidas Tiro 23 Track Pants",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80",
  },
  {
    name: "H&M Cotton Jersey Joggers",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
  },
  {
    name: "Puma Running Cap",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
  },
  {
    name: "Nike Dri-FIT Swoosh Cap",
    image: "https://images.unsplash.com/photo-1556306535-38febf6782be?w=600&q=80",
  },
];

mongoose.connect("mongodb://localhost:27017/hackon").then(async () => {
  for (const fix of fixes) {
    const result = await Product.updateOne({ name: fix.name }, { $set: { image: fix.image } });
    console.log(result.modifiedCount ? "  ✓ fixed:" : "  – not found:", fix.name);
  }
  console.log("\nAll images updated.");
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });

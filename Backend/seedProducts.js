const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  brand: String,
  name: String,
  price: Number,
  image: String,
  description: String,
  type: String,
});
const Product = mongoose.model("Product", productSchema);

const products = [
  // ── Shoes ────────────────────────────────────────────────
  {
    brand: "Puma",
    name: "Puma Wired Run Sneakers",
    price: 799,
    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/377028/01/sv01/fnd/IND/fmt/png/Wired-Run-Unisex-Sneakers",
    description: "Lightweight mesh upper with IMEVA midsole for all-day comfort. Clean, minimal silhouette perfect for daily wear.",
    type: "Shoes",
  },
  {
    brand: "Skechers",
    name: "Skechers Go Walk Arch Fit",
    price: 999,
    image: "https://www.skechers.in/dw/image/v2/BDCN_PRD/on/demandware.static/-/Sites-skechers-master/default/dw8f0c8a10/images/large/216260_NVY.jpg",
    description: "Responsive 5GEN cushioning with a breathable engineered knit upper. Walk all day in cloud-like comfort.",
    type: "Shoes",
  },
  {
    brand: "Reebok",
    name: "Reebok Runner 4.0 Shoes",
    price: 849,
    image: "https://assets.reebok.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/f0ef0e3dcfe44a0eb7e2ac7900b1d8c7_9366/Runner_4.0_Shoes_Black_FW5029_01_standard.jpg",
    description: "Soft foam midsole and breathable mesh upper built for everyday running. Durable rubber outsole for traction.",
    type: "Shoes",
  },
  {
    brand: "Campus",
    name: "Campus Flyer Running Shoes",
    price: 599,
    image: "https://m.media-amazon.com/images/I/71oGFOHSOkL._UL1500_.jpg",
    description: "High-rebound EVA sole with mesh upper. Ultra-lightweight at just 280g — great for gym and outdoor runs.",
    type: "Shoes",
  },

  // ── Bags ─────────────────────────────────────────────────
  {
    brand: "Skybags",
    name: "Skybags Bingo 19L Backpack",
    price: 699,
    image: "https://m.media-amazon.com/images/I/71bZ1MXsYeL._SL1500_.jpg",
    description: "19L capacity with padded laptop sleeve up to 14\". Water-resistant polyester fabric with dual side pockets.",
    type: "Bags",
  },
  {
    brand: "Adidas",
    name: "Adidas Linear Classic Backpack",
    price: 899,
    image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/2b8a04f76e2e42d4b6e5ad0400c51e96_9366/Linear_Classic_Backpack_Black_ED0289_01_standard.jpg",
    description: "Clean everyday adidas logo backpack. Main zip compartment, front zip pocket, and adjustable padded straps.",
    type: "Bags",
  },
  {
    brand: "Fastrack",
    name: "Fastrack 22L Laptop Backpack",
    price: 799,
    image: "https://m.media-amazon.com/images/I/71WKUD7wC5L._SL1500_.jpg",
    description: "Padded laptop compartment for 15.6\" laptops. USB charging port, rain cover included, water-resistant zippers.",
    type: "Bags",
  },

  // ── T-Shirts ──────────────────────────────────────────────
  {
    brand: "H&M",
    name: "H&M Regular Fit Round-Neck Tee",
    price: 299,
    image: "https://lp2.hm.com/hmgoepprod?set=quality%5B79%5D%2Csource%5B%2F13%2Fdb%2F13db5f16e0a86e63fe1c5b1ecdfc7b2c2c01ee5b.jpg%5D%2Corigin%5Bdam%5D%2Ccategory%5B%5D%2Ctype%5BLOOKBOOK%5D%2Cres%5Bm%5D%2Chmver%5B1%5D&call=url[file:/product/main]",
    description: "Soft jersey cotton T-shirt with a relaxed round neck. Versatile staple for any casual outfit.",
    type: "Tshirt",
  },
  {
    brand: "Puma",
    name: "Puma ESS Small Logo Tee",
    price: 499,
    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/586668/01/mod01/fnd/IND/fmt/png/ESS-Small-Logo-Men's-Tee",
    description: "100% cotton regular-fit tee with a small PUMA cat logo on the chest. Soft, breathable, and easy to style.",
    type: "Tshirt",
  },
  {
    brand: "Levi's",
    name: "Levi's Graphic Crew Neck Tee",
    price: 599,
    image: "https://lsco.scene7.com/is/image/lsco/224910006-front-pdp?fmt=jpeg&qlt=70&resMode=sharp2&op_usm=0.6,0.6,8&wid=2000&hei=2000&fit=crop,0",
    description: "Classic Levi's logo graphic tee in soft jersey cotton. A wardrobe essential with iconic brand appeal.",
    type: "Tshirt",
  },
  {
    brand: "Nike",
    name: "Nike Sportswear Club Tee",
    price: 699,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e5a74c1a-d09e-4e95-9b7d-9ba60dcb4c5b/sportswear-club-t-shirt-BtqrFm.png",
    description: "Soft French terry fabric with a relaxed fit. Ribbed crewneck and drop-tail hem for a casual, modern look.",
    type: "Tshirt",
  },

  // ── Bottom Wear ───────────────────────────────────────────
  {
    brand: "Adidas",
    name: "Adidas Tiro 23 Track Pants",
    price: 699,
    image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fcf3792571fa4c7190e8ad3300e2ff3f_9366/Tiro_23_League_Training_Pants_Black_IB8477_21_model.jpg",
    description: "Slim tapered fit with 100% recycled polyester. Side zip pockets and elastic cuffs for a secure, athletic feel.",
    type: "BottomWear",
  },
  {
    brand: "H&M",
    name: "H&M Cotton Jersey Joggers",
    price: 399,
    image: "https://lp2.hm.com/hmgoepprod?set=quality%5B79%5D%2Csource%5B%2F7f%2Fdb%2F7fdb7e0157e0c571b1e3f32e23023b5db1d9d39d.jpg%5D%2Corigin%5Bdam%5D%2Ccategory%5B%5D%2Ctype%5BLOOKBOOK%5D%2Cres%5Bm%5D%2Chmver%5B1%5D&call=url[file:/product/main]",
    description: "Relaxed-fit joggers in soft cotton jersey with an elasticated waistband and drawstring. Side and back pockets.",
    type: "BottomWear",
  },

  // ── Caps ──────────────────────────────────────────────────
  {
    brand: "Puma",
    name: "Puma Running Cap",
    price: 349,
    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_600,h_600/global/021574/01/mod01/fnd/IND/fmt/png/Running-Cap",
    description: "Lightweight performance cap with UV protection. Moisture-wicking sweatband and adjustable back strap.",
    type: "Caps",
  },
  {
    brand: "Nike",
    name: "Nike Dri-FIT Swoosh Cap",
    price: 449,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/0b95e1f1-76c1-4ead-a758-9de64d5cbf41/dri-fit-swoosh-running-cap-Kx1T4m.png",
    description: "Dri-FIT technology wicks sweat for a cool, dry feel. Curved brim and adjustable closure for a secure fit.",
    type: "Caps",
  },
];

mongoose.connect("mongodb://localhost:27017/hackon").then(async () => {
  let added = 0;
  for (const p of products) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await new Product(p).save();
      added++;
      console.log("  ✓", p.name, "—", `₹${p.price}`);
    } else {
      console.log("  – skip (exists):", p.name);
    }
  }
  console.log(`\nDone. Added ${added} new products.`);
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });

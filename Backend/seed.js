const mongoose = require("mongoose");
require("dotenv").config();

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
  // Shoes
  {
    brand: "Nike",
    name: "Nike Air Max Pulse",
    price: 12499,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211d-1467-4f6a-b5be-f6e2e385f8ee/air-max-pulse-shoes-mqHpQL.png",
    description: "Inspired by the pulsating energy of the London music scene, the Nike Air Max Pulse brings bold details to a familiar Air Max silhouette.",
    type: "Shoes",
  },
  {
    brand: "Adidas",
    name: "Adidas Ultraboost 22",
    price: 14999,
    image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg",
    description: "These running shoes feature responsive BOOST midsole cushioning and a Primeknit+ upper for a snug, foot-hugging feel.",
    type: "Shoes",
  },
  {
    brand: "Puma",
    name: "Puma RS-X Reinvention",
    price: 9499,
    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/369579/02/sv01/fnd/IND/fmt/png",
    description: "The Puma RS-X Reinvention takes the iconic RS running system and gives it a bold, chunky update with premium materials.",
    type: "Shoes",
  },
  {
    brand: "New Balance",
    name: "New Balance 574 Classic",
    price: 7999,
    image: "https://nb.scene7.com/is/image/NB/ml574evg_nb_02_i?$pdpflexf2$&qlt=80&fmt=webp&wid=440&hei=440",
    description: "A timeless classic, the New Balance 574 features premium suede and mesh upper with the legendary ENCAP midsole.",
    type: "Shoes",
  },

  // Tshirt
  {
    brand: "H&M",
    name: "Slim Fit Crew-Neck T-Shirt",
    price: 799,
    image: "https://lp2.hm.com/hmgoepprod?set=quality%5B79%5D%2Csource%5B%2F27%2Fb4%2F27b4ed5fbeb78c9ee0be43dc4b4e95f0a7bf8a65.jpg%5D%2Corigin%5Bdam%5D%2Ccategory%5B%5D%2Ctype%5BLOOKBOOK%5D%2Cres%5Bm%5D%2Chmver%5B1%5D&call=url[file:/product/main]",
    description: "A lightweight and breathable slim-fit t-shirt made from soft cotton jersey with a comfortable crew neck.",
    type: "Tshirt",
  },
  {
    brand: "Zara",
    name: "Oversized Graphic Tee",
    price: 1299,
    image: "https://static.zara.net/photos///2023/I/0/1/p/8323/401/251/2/w/563/8323401251_6_1_1.jpg?ts=1692700958741",
    description: "Trendy oversized graphic tee made from premium 100% cotton. Features a bold front print and relaxed fit.",
    type: "Tshirt",
  },
  {
    brand: "Levi's",
    name: "Levi's Classic Logo T-Shirt",
    price: 1499,
    image: "https://lsco.scene7.com/is/image/lsco/799800012-front-pdp?fmt=jpeg&qlt=70&resMode=sharp2&op_usm=0.6,0.6,8&wid=2000&hei=2000&fit=crop,0",
    description: "The iconic Levi's logo tee. Made from soft cotton with a classic fit perfect for everyday wear.",
    type: "Tshirt",
  },

  // BottomWear
  {
    brand: "Levi's",
    name: "Levi's 511 Slim Fit Jeans",
    price: 3499,
    image: "https://lsco.scene7.com/is/image/lsco/045111392-front-pdp?fmt=jpeg&qlt=70&resMode=sharp2&op_usm=0.6,0.6,8&wid=2000&hei=2000&fit=crop,0",
    description: "The 511 Slim Fit Jeans sit below the waist and are slim through the thigh with a narrow leg opening.",
    type: "BottomWear",
  },
  {
    brand: "Nike",
    name: "Nike Dri-FIT Training Shorts",
    price: 2299,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/03e7024a-9bfe-4a13-bc4c-91a2e49d40ba/dri-fit-training-shorts-2G9xVt.png",
    description: "Nike Dri-FIT technology moves sweat away from your skin for quicker evaporation, keeping you dry and comfortable.",
    type: "BottomWear",
  },
  {
    brand: "Zara",
    name: "Slim Chino Pants",
    price: 2999,
    image: "https://static.zara.net/photos///2023/I/0/1/p/0005/521/712/2/w/563/0005521712_6_1_1.jpg?ts=1692009866285",
    description: "Versatile slim-fit chino pants made from a comfortable stretch fabric. Perfect for both casual and semi-formal wear.",
    type: "BottomWear",
  },

  // Bags
  {
    brand: "Wildcraft",
    name: "Wildcraft 30L Laptop Backpack",
    price: 1799,
    image: "https://www.wildcraft.in/cdn/shop/products/11302-1_1024x.jpg?v=1638441697",
    description: "A durable 30L backpack with a dedicated laptop compartment, multiple organiser pockets and ergonomic padded shoulder straps.",
    type: "Bags",
  },
  {
    brand: "Puma",
    name: "Puma Phase Backpack",
    price: 1399,
    image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa/global/075487/01/sv01/fnd/IND/fmt/png",
    description: "The Puma Phase Backpack offers simple, clean design with enough room for all your daily essentials.",
    type: "Bags",
  },

  // Caps
  {
    brand: "Nike",
    name: "Nike Heritage 86 Cap",
    price: 1499,
    image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e77fc39e-cf42-4fca-ad5e-efc64b2e5524/heritage-86-futura-wash-cap-SZfMbT.png",
    description: "The Nike Heritage 86 Futura Wash Cap is made from a soft cotton twill with a curved bill and a structured fit.",
    type: "Caps",
  },
  {
    brand: "Adidas",
    name: "Adidas Trefoil Baseball Cap",
    price: 1299,
    image: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/c758d0ee-a521-4df6-90d8-acab0109c8e6_9366/Trefoil_Baseball_Cap_Black_HT6359_01_standard.jpg",
    description: "Classic Adidas baseball cap featuring a large embroidered Trefoil logo on the front and a snap closure for adjustable fit.",
    type: "Caps",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    await Product.insertMany(products);
    console.log(`🌱 Seeded ${products.length} products successfully!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();

import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import iphonePng from "../assets/iphoneBlack.jpg";
import watchPng from "../assets/appleWatch.jpg";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import userPng from "../assets/userAvatar.png";
import orderPng from "../assets/order_package.svg";
import bagPng from "../assets/Backpack.png";
import dogPng from "../assets/dog.png";
// import laptopPng from "../assets/Laptop.png";
import shoePng from "../assets/sneakers.png";
// import toysPng from "../assets/toys.png";
import shoes6Png from "../assets/Shoes 6.PNG";
import Products from "./Products";

function Home() {
  return (
    <div>
      <div className="heroContainer">
        <div className="heroContainerLeft">
          <div className="heroHeading">SHOP CLOTHING & ACCESSORIES</div>
          <div className="heroDesc">
            Order Shoes, Tops, Backpacks, Shorts, Leggings, Caps, Jeans,
            T-Shirts and much more
          </div>
          <Link to="/category-products?type=All" className="allProductsButton">
            <button className="heroButton">
              <div>Explore all Products</div>
              <span>➜</span>
            </button>
          </Link>
        </div>

        <Swiper
          spaceBetween={40}
          slidesPerView={1.6}
          onSlideChange={() => {}}
          onSwiper={() => {}}
        >
          <SwiperSlide>
            <Link to="/category-products?type=All">
              <div className="swiperCard">
                <div className="cardDetails">
                  <div className="cardCompany">Apple</div>
                  <div className="cardHeading">Watch Ultra 2 Smartwatch</div>
                  <div className="cardPrice">₹ 89,900.00</div>
                </div>
                <img
                  className="heroImg"
                  src={watchPng}
                  height="
            380px"
                  alt="headphone"
                />
              </div>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link to="/category-products?type=Shoes">
              <div className="swiperCard">
                <div className="cardDetails">
                  <div className="cardCompany">Nike</div>
                  <div className="cardHeading">Nike Men's Air Max pulse</div>
                  <div className="cardPrice">₹ 12,499.00</div>
                </div>
                <img
                  className="heroImg"
                  src={shoes6Png}
                  height="
            440px"
                  alt="headphone"
                />
              </div>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link to="/category-products?type=All">
              <div className="swiperCard">
                <div className="cardDetails">
                  <div className="cardCompany">Apple</div>
                  <div className="cardHeading">iPhone 15 Pro 128 GB</div>
                  <div className="cardPrice">₹ 1,30,990.00</div>
                </div>
                <img
                  className="heroImg"
                  src={iphonePng}
                  height="
            380px"
                  alt="headphone"
                />
              </div>
            </Link>
          </SwiperSlide>
        </Swiper>
      </div>

      <div className="accountContainer">
        <div className="accountItems">
          <div className="itemCard">
            <img width="50px" src={userPng} alt="profileDeals" />
            <div>
              <div>Hi, {localStorage.getItem("userName") || "there"}</div>
              <div> recommendations for you</div>
            </div>
          </div>
          <Link to="/cart">
            <div className="itemCard">
              <img width="96px" src={orderPng} alt="ordersDeals" />
              <div>
                <div>Your Cart</div>
                <div>View your Cart</div>
              </div>
            </div>
          </Link>
          <div className="itemCard">
            <img width="100px" src={shoePng} alt="mobileDeals" />
            <div>
              <div>Big sale upto 40% off</div>
              <div>Discounted Products</div>
            </div>
          </div>
          <div className="itemCard">
            <img width="68px" src={bagPng} alt="newDeals" />
            <div>
              <div>Recently Viewed</div>
              <div>Pick up where you left off</div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Life feature discovery banner */}
      <div style={{
        margin: "28px 30px 0",
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
        borderRadius: 14,
        padding: "28px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", letterSpacing: 1, marginBottom: 6 }}>
            🌿 NEW — AI-POWERED RETURNS
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            Second Life Marketplace
          </div>
          <div style={{ fontSize: 14, color: "#a7f3d0", maxWidth: 480, lineHeight: 1.6 }}>
            Return smarter. Resell sustainably. Buy pre-owned items graded by AI and earn Green Credits on every action.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.12)", color: "#d1fae5", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>🤖 AI Quality Grading</span>
            <span style={{ background: "rgba(255,255,255,0.12)", color: "#d1fae5", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>🌱 Carbon Impact Tracked</span>
            <span style={{ background: "rgba(255,255,255,0.12)", color: "#d1fae5", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)" }}>🌿 Earn Green Credits</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <Link to="/second-life" style={{
            display: "inline-block", background: "#6ee7b7", color: "#064e3b",
            fontWeight: 800, fontSize: 15, padding: "12px 28px",
            borderRadius: 10, textDecoration: "none", textAlign: "center",
            transition: "background 0.2s",
          }}>
            Browse Marketplace →
          </Link>
          <Link to="/returns" style={{
            display: "inline-block", background: "rgba(255,255,255,0.12)", color: "#d1fae5",
            fontWeight: 700, fontSize: 14, padding: "10px 28px",
            borderRadius: 10, textDecoration: "none", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.25)",
          }}>
            ↩ Return an Item
          </Link>
        </div>
      </div>

      <div className="categoryHeaders">
        <div>Shop by categories →</div>
      </div>
      <div className="categoryContainer">
        <div className="categoryItems">
          <Link
            to="/category-products?type=Tshirt"
            className="categoryitemCard"
          >
            <div>Tops & Shirts</div>
          </Link>
          <Link to="/category-products?type=Shoes" className="categoryitemCard">
            <div>Sneakers & Shoes</div>
          </Link>
          <Link to="/category-products?type=Bags" className="categoryitemCard">
            <div>Bags & Backpacks</div>
          </Link>
          <Link to="/category-products?type=Caps" className="categoryitemCard">
            <div>Hats & Caps</div>
          </Link>
        </div>
      </div>

      <div className="productsHeaders">
        <div>Pick up where you left off</div>
      </div>
      <Products type="Shoes" />

      <div className="bannerContainer">
        <div className="bannerContainerLeft">
          <div className="bannerHeading">AMAZON DELIVERS TO YOU</div>
          <div className="bannerDesc">
            Worldwide shipping. We ship to over 100 countries and regions, right
            to your doorstep.
          </div>
        </div>
        <div className="bannerImg">
          <img src={dogPng} alt="headphone" />
        </div>
      </div>

      <div className="productsHeaders">
        <div>Tops & T-Shirts Clothing</div>
      </div>
      <Products type="Tshirt" />

      <div className="productsHeaders">
        <div>Pants & Leggings Clothing</div>
      </div>
      <Products type="BottomWear" />

      <div className="productsHeaders">
        <div>All Our Products</div>
        <Link to="/category-products?type=All">→</Link>
      </div>
      <Products />
    </div>
  );
}

export default Home;

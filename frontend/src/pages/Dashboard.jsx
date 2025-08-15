import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ShoppingCart, Heart, CreditCard, Star } from "lucide-react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";

const Home = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { logout, userId, isAuthenticated } = useAuthStore();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();

  const zodiacImages = [
    assets.Aquarius,
    assets.Aries,
    assets.Cancer,
    assets.Capricorn,
    assets.Gemini,
    assets.Leo,
    assets.Libra,
    assets.Pisces,
    assets.Sagittarius,
    assets.Taurus,
    assets.Virgo,
    assets.Scorpio,
  ];

  const getTotalStock = (stockArr) =>
    Array.isArray(stockArr)
      ? stockArr.reduce((sum, s) => sum + (s.quantity || 0), 0)
      : 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch");
        setProducts(await res.json());
      } catch {
        toast.error("❌ Error fetching products!");
      }
    })();
  }, []);

  const handleAddToCart = (p) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
      return setTimeout(() => navigate("/cart"), 3000);
    }
    navigate(`/single-product/${p._id}`);
  };

  const handleBuyNow = (p) => navigate(`/single-product/${p._id}`);

  const handleWishlistToggle = (p) => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage wishlist!");
      return navigate("/wishlist");
    }
    if (wishlist.some((w) => w._id === p._id)) {
      removeFromWishlist(p._id);
      toast.success("Removed from Loved It!");
    } else {
      addToWishlist(p);
      toast.success("Added to Loved It!");
    }
  };

  return (
    <div className="bg-gradient-to-b from-black via-black to-indigo-900 text-white min-h-screen flex flex-col font-poppins">
      {/* Logo */}
      <div
        className="w-full cursor-pointer"
        onClick={() => navigate("/astro-list")}
      >
        <img
          src={assets.ChatWithAstroLogo}
          alt="Chat With Astrologer"
          className="w-full max-w-screen-xl mx-auto px-0 sm:px-6 md:px-8 py-7 md:py-10"
        />
      </div>

      {/* Zodiac Carousel */}
      <section className="py-4">
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation
          loop
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          spaceBetween={10}
          breakpoints={{
            0: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 6 },
          }}
          className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {zodiacImages.map((src, idx) => (
            <SwiperSlide key={idx} className="w-full h-24 sm:h-32 md:h-40">
              <img
                onClick={() => navigate("/daily-prediction")}
                src={src}
                alt={`Zodiac ${idx}`}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Product Grid (Dashboard-style, dark theme) */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto flex-grow">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          Trending Products
        </h2>
        <div className="grid grid-cols-2 gap-[2px] md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const stock = getTotalStock(p.stock);
            const isOutOfStock = stock <= 0;
            const sizes =
              Array.isArray(p.stock) && p.stock.length > 0
                ? p.stock
                    .filter((s) => !!s.size)
                    .map((s) => s.size)
                    .join(", ")
                : "-";
            const reviews = Array.isArray(p.reviews) ? p.reviews : [];
            const rating = reviews.length
              ? Math.round(
                  reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
                )
              : 0;

            return (
              <div
                key={p._id}
                className={`relative rounded shadow-xs transition hover:shadow-lg flex flex-col bg-gray-800/90 border border-gray-700 text-white
                  ${
                    isOutOfStock
                      ? "opacity-60 pointer-events-none grayscale"
                      : "hover:scale-[1.02]"
                  }
                `}
                style={{
                  boxShadow: "0 1px 0 0 #232323, 1px 0 0 0 #232323",
                }}
              >
                <div className="w-full aspect-[2/2.7] relative bg-black overflow-hidden flex items-center justify-center">
                  <img
                    src={p?.image?.[0]}
                    alt={p.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isOutOfStock
                        ? "grayscale pointer-events-none"
                        : "hover:scale-105"
                    }`}
                    onClick={() =>
                      !isOutOfStock && navigate(`/single-product/${p._id}`)
                    }
                  />
                  {isOutOfStock && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[12px] font-semibold px-2 py-1 rounded shadow-sm">
                      Out of Stock
                    </span>
                  )}
                  {!isOutOfStock && (
                    <div className="absolute top-2 right-2 flex flex-col space-y-2">
                      <button
                        className="bg-black/80 p-1.5 rounded-full shadow-sm hover:bg-gray-700"
                        onClick={() => handleWishlistToggle(p)}
                        aria-label="Wishlist"
                      >
                        <Heart
                          size={18}
                          className={
                            wishlist.some((w) => w._id === p._id)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-200"
                          }
                        />
                      </button>
                      <button
                        className="bg-indigo-700 text-white p-1.5 rounded-full shadow hover:bg-indigo-800"
                        onClick={() => handleAddToCart(p)}
                        aria-label="Add to Cart"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 px-3 py-3 flex flex-col gap-[2px]">
                  <div
                    className="text-base font-bold truncate hover:underline"
                    title={p.name}
                    onClick={() =>
                      !isOutOfStock && navigate(`/single-product/${p._id}`)
                    }
                  >
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-300">{p.miniDesc}</div>
                  <div className="text-xs font-medium text-gray-400">
                    Size: {sizes}
                  </div>
                  <div className="flex items-center text-yellow-400">
                    {Array(rating)
                      .fill()
                      .map((_, i) => (
                        <Star key={i} size={12} />
                      ))}
                    <span className="ml-1 text-gray-400 text-xs">
                      ({reviews.length})
                    </span>
                  </div>
                  {!isOutOfStock && stock < 10 && (
                    <div
                      className={`inline-block text-xs font-bold px-1.5 py-1 rounded-full shadow mt-1 mb-1
                      ${
                        stock < 5
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      {stock < 5 ? "Only few left!" : "Limited stock"}
                    </div>
                  )}
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-bold text-indigo-400 tracking-tight">
                      ₹{p.price}
                    </span>
                    {!isOutOfStock && (
                      <button
                        className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white text-sm font-bold px-4 py-2 rounded-full shadow focus:outline-none hover:from-indigo-800 hover:to-black"
                        style={{ minWidth: 80 }}
                        onClick={() => handleBuyNow(p)}
                      >
                        <CreditCard size={14} className="inline mr-1" />
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 sm:px-6 bg-black/80 text-center text-white">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Testimonials</h2>
        <p className="max-w-2xl mx-auto italic mb-2 text-xs sm:text-base">
          “This is the best astrology store! Amazing products and great
          service.”
        </p>
        <p className="font-medium mb-6">— SV ASTRO PRIVATE LIMITED</p>
        <button
          onClick={() => navigate("/astro-list")}
          className="text-sm sm:text-base bg-gradient-to-r from-yellow-500 to-yellow-700 text-black hover:from-yellow-600 hover:to-yellow-800 py-1 sm:py-2 px-4 sm:px-6 shadow rounded"
        >
          Chat with Astrologer
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center py-4 mt-auto select-none text-sm">
        © {new Date().getFullYear()} SV ASTRO PRIVATE LIMITED. All rights
        reserved.
      </footer>
    </div>
  );
};

export default Home;

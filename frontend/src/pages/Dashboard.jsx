import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  CreditCard,
  Star,
} from "lucide-react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

// ShadCN UI imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { logout, userId, isAuthenticated } = useAuthStore();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();

  const slides = [assets.Aquarius, assets.Aries, assets.Cancer,assets.Capricorn,assets.Gemini,assets.Leo,assets.Libra,assets.Pisces,assets.Sagittarius,assets.Taurus,assets.Virgo,];
  const nextSlide = () => setCurrentSlide((i) => (i + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((i) => (i - 1 + slides.length) % slides.length);

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

  useEffect(() => {
    const iv = setInterval(nextSlide, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleAddToCart = (p) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
      return setTimeout(() => navigate("/cart"), 3000);
    }
    navigate(`/single-product/${p._id}`);
  };
  const handleBuyNow = async (p) => {
    await handleAddToCart(p);
    navigate(`/single-product/${p._id}`);
  };
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
    <div className="bg-gradient-to-b from-indigo-900 via-black to-indigo-900 text-white">
      {/* Hero Slider */}
      <div className="relative h-56 sm:h-72 md:h-150 overflow-hidden">
        <img
          src={slides[currentSlide]}
          alt="Hero"
          className="w-full h-full object-fill"
        />
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/70"
        >
          <ChevronRight className="text-white" />
        </button>
      </div>
      {/* Products */}
      <section className="py-10 px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          Our Products
        </h2>
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation
          autoplay={{ delay: 3000 }}
          spaceBetween={16}
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
 
          {products.map((p) => {
            const stock = getTotalStock(p.stock);
            const reviews = Array.isArray(p.reviews) ? p.reviews : [];
            const rating = reviews.length
              ? Math.round(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length)
              : 0;

            return (
              <SwiperSlide key={p._id}>
                <Card className="mx-auto max-w-xs sm:max-w-sm bg-gray-800/80 border border-gray-700 text-white hover:shadow-xl transition">
                  {/* Wishlist */}
                  <button
                    onClick={() => handleWishlistToggle(p)}
                    className="absolute top-3 right-3 bg-gray-800/90 p-1 rounded-full shadow hover:bg-gray-700 z-10"
                  >
                    <Heart
                      size={20}
                      className={
                        wishlist.some((w) => w._id === p._id)
                          ? "text-red-500 fill-red-500"
                          : "text-gray-400"
                      }
                    />
                  </button>

                  <CardHeader className="p-0">
                    <div
                      className="pt-[80%] sm:pt-[75%] relative overflow-hidden rounded-t-lg cursor-pointer"
                      onClick={() => navigate(`/single-product/${p._id}`)}
                    >
                      <img
                        src={p.image?.[0]}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-contain p-3"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                    <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">
                      {p.name}
                    </CardTitle>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-bold">₹{p.price}</span>
                      {p.mrp > p.price && (
                        <span className="text-xs sm:text-sm line-through text-gray-500">
                          ₹{p.mrp}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-xs sm:text-sm font-medium ${
                        stock === 0
                          ? "text-red-400"
                          : stock < 10
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {stock === 0
                        ? "Out of Stock"
                        : stock < 10
                        ? "Only a few left!"
                        : "In Stock"}
                    </p>

                    <div className="mt-1 flex items-center text-yellow-300">
                      {Array(rating)
                        .fill()
                        .map((_, i) => (
                          <Star key={i} size={14} />
                        ))}
                      <span className="text-gray-400 text-xs ml-1">
                        ({reviews.length})
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleAddToCart(p)}
                      disabled={stock === 0}
                      className="w-full sm:w-1/2 text-sm bg-gradient-to-r from-yellow-500 to-yellow-700 text-black hover:from-yellow-600 hover:to-yellow-800 py-1 sm:py-2"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleBuyNow(p)}
                      disabled={stock === 0}
                      className="w-full sm:w-1/2 text-sm bg-gradient-to-r from-yellow-500 to-yellow-700 text-black hover:from-yellow-600 hover:to-yellow-800 py-1 sm:py-2"
                    >
                      <CreditCard size={16} />
                      Buy Now
                    </Button>
                  </CardFooter>
                </Card>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>
            <div className="w-full pt-70 " onClick={()=>navigate("/astro-list")}>
  <img
    src={assets.ChatWithAstroLogo}
    alt="Chat With Astrologer" 
className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10"  />
</div>
      {/* Testimonials */}
      <section className="py-12 px-4 sm:px-6 bg-black/80 text-center text-white">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Testimonials</h2>
        <p className="max-w-2xl mx-auto italic mb-2 text-xs sm:text-base">
          “This is the best astrology store! Amazing products and great service.”
        </p>
        <p className="font-medium mb-6">— Siddhivinayak Astro</p>
        <Button
          onClick={() => navigate("/astro-list")}
          className="text-sm sm:text-base bg-gradient-to-r from-yellow-500 to-yellow-700 text-black hover:from-yellow-600 hover:to-yellow-800 py-1 sm:py-2 px-4 sm:px-6"
        >
          Chat with Astrologer
        </Button>
      </section>
    </div>
  );
};

export default Home;

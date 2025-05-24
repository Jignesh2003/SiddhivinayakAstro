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
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
    const { logout } = useAuthStore();
  

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slides = [assets.GaneshJi, assets.Meditation, assets.girlAstro];

  const addToCart = useCartStore((state) => state.addToCart);
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("❌ Error fetching products!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = async (product) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
      setTimeout(() => navigate("/cart"), 3000);
      return;
    }

    if (product.stock === 0) return;

    await addToCart(product, userId, 1);
    toast.success("Added to cart!");
  };

  const handleBuyNow = async (product) => {
    await handleAddToCart(product);
    navigate("/cart");
  };

  const handleWishlistToggle = (product) => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your wishlist!");
      return navigate("/wishlist");
    }

    if (wishlist.some((item) => item._id === product._id)) {
      removeFromWishlist(product._id);
      toast.success("❤️ Removed from Loved It! ❤️");
    } else {
      addToWishlist(product);
      toast.success("❤️ Added to Loved It! ❤️");
    }
  };

  return (
    <div
      className="w-full bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      {/* Image Slider */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden py-10 flex items-center justify-center">
        <img
          src={slides[currentSlide]}
          alt="Slider"
          className="w-full h-full object-contain transition-all duration-500"
        />
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
          onClick={prevSlide}
        >
          <ChevronLeft />
        </button>
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full"
          onClick={nextSlide}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Products Slider */}
      <section className="py-10 px-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Our Products</h2>
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation
          autoplay={{ delay: 3000 }}
          spaceBetween={20}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product._id}>
              <div className="bg-white shadow-md rounded-lg p-4 text-black relative flex flex-col justify-between hover:scale-105 transition h-130">
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
                >
                  <Heart
                    size={20}
                    className={
                      wishlist.some((item) => item._id === product._id)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-400"
                    }
                  />
                </button>

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-70 object-fit rounded-md cursor-pointer"
                  onClick={() => navigate(`/single-product/${product._id}`)}
                />
                <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600">₹{product.price}</p>
                <p
                  className={
                    product.stock === 0
                      ? "text-red-600 font-semibold"
                      : product.stock < 10
                      ? "text-red-500"
                      : "text-green-600"
                  }
                >
                  {product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock}`}
                </p>
                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                  {Array(
                    Math.round(
                      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
                        product.reviews.length || 0
                    )
                  )
                    .fill()
                    .map((_, i) => (
                      <Star key={i} size={16} />
                    ))}
                  <span className="text-gray-600 text-sm">
                    ({product.reviews.length} reviews)
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 bg-yellow-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-yellow-600 transition disabled:bg-gray-400"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button
                    className="flex-1 bg-purple-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400"
                    onClick={() => handleBuyNow(product)}
                    disabled={product.stock === 0}
                  >
                    <CreditCard size={16} /> Buy Now
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Testimonials */}
      <section
        className="py-10 bg-cover bg-center px-6"
        style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Testimonials</h2>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-200 italic">
            “This is the best astrology store! Amazing products and great service.”
          </p>
          <h4 className="mt-4 font-semibold text-gray-300">- Siddhivinayak Astro</h4>
          <button onClick={()=>navigate("/astro-user-chat")}>Chat with Astrologer</button>

        </div>
      </section>
    </div>
  );
};

export default Home;

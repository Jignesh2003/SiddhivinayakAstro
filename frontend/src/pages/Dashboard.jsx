import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import {
  ShoppingCart,
  Heart,
  CreditCard,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ArrowUp,
} from "lucide-react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    size: [],
    priceRange: "",
  });
  const [sortOption, setSortOption] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

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

  // Unique filters options
  const uniqueCategories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const uniqueBrands = [
    ...new Set(products.map((p) => p.brand).filter(Boolean)),
  ];
  const uniqueSizes = [
    ...new Set(
      products.flatMap((p) =>
        Array.isArray(p.stock) ? p.stock.map((s) => s.size).filter(Boolean) : []
      )
    ),
  ];
  const priceRanges = [
    { label: "Below ₹1000", value: "below1000" },
    { label: "₹1000 - 2000", value: "1000-2000" },
    { label: "₹2000 - 3000", value: "2000-3000" },
    { label: "Above ₹3000", value: "above3000" },
  ];

  // Fetch products from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch {
        toast.error("❌ Error fetching products!");
      }
    })();
  }, []);

  // Show/hide Go to Top button based on scroll position
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 250);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter toggle handler
  const toggleFilter = (type, value) => {
    if (type === "priceRange") {
      setFilters((prev) => ({
        ...prev,
        priceRange: prev.priceRange === value ? "" : value,
      }));
    } else {
      setFilters((prev) => {
        const current = prev[type];
        return {
          ...prev,
          [type]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      });
    }
  };

  // Apply filters and sort products
  const applyFiltersAndSort = () => {
    let result = [...products];

    if (filters.category.length) {
      result = result.filter((p) => filters.category.includes(p.category));
    }
    if (filters.brand.length) {
      result = result.filter((p) => filters.brand.includes(p.brand));
    }
    if (filters.size.length) {
      result = result.filter((p) =>
        p.stock?.some((s) => filters.size.includes(s.size))
      );
    }
    if (filters.priceRange) {
      result = result.filter((p) => {
        const price = p.price || 0;
        switch (filters.priceRange) {
          case "below1000":
            return price < 1000;
          case "1000-2000":
            return price >= 1000 && price <= 2000;
          case "2000-3000":
            return price > 2000 && price <= 3000;
          case "above3000":
            return price > 3000;
          default:
            return true;
        }
      });
    }

    if (sortOption === "priceLowHigh") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "priceHighLow")
      result.sort((a, b) => b.price - a.price);
    else if (sortOption === "nameAZ")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "nameZA")
      result.sort((a, b) => b.name.localeCompare(a.name));

    setFilteredProducts(result);
    setShowFilterModal(false);
    setShowSortModal(false);
  };

  // Reset all filters & sorting
  const resetFilters = () => {
    setFilters({ category: [], brand: [], size: [], priceRange: "" });
    setSortOption("");
    setFilteredProducts(products);
    setShowFilterModal(false);
    setShowSortModal(false);
  };

  // Handlers for cart and wishlist
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
const posters = [ assets.Poster2, assets.Poster3, assets.Poster4, assets.Poster5];
  return (
    <div className="bg-gradient-to-b from-black via-black to-indigo-900 text-white min-h-screen flex flex-col font-poppins">
      <section className="py-6 ">
        <Swiper
          modules={[Navigation, Autoplay]}
          // navigation
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1 },
            480: { slidesPerView: 2 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 6 },
          }}
          className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          {posters.map((src, idx) => (
            <SwiperSlide
              key={idx}
              className="w-full h-40 md:h-48 rounded-lg overflow-hidden shadow-lg cursor-pointer"
            >
              <img
                onClick={() => navigate("/products")}
                src={src}
                alt={`Poster ${idx}`}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                loading="lazy"
                draggable={true}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

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

      {/* Desktop Filter Sidebar */}
      <div className="flex max-w-screen-xl mx-auto mb-6 px-4 sm:px-6 lg:px-8">
        <aside className="hidden lg:block w-64 bg-gray-900 border border-gray-800 rounded-md shadow-sm p-4 sticky top-28 max-h-[85vh] overflow-y-auto mr-6 text-gray-300">
          <h3 className="font-semibold mb-3 text-white">Sort By</h3>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full border border-gray-700 bg-gray-900 text-white rounded p-2 mb-6 outline-none"
            aria-label="Sort products"
          >
            <option value="">None</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
            <option value="nameAZ">Name: A to Z</option>
            <option value="nameZA">Name: Z to A</option>
          </select>

          <div>
            <h3 className="font-semibold text-white mb-2">Category</h3>
            {uniqueCategories.map((cat) => (
              <label
                key={cat}
                className="block mb-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={filters.category.includes(cat)}
                  onChange={() => toggleFilter("category", cat)}
                  className="mr-2 accent-indigo-500"
                />
                {cat}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-white mb-2">Brand</h3>
            {uniqueBrands.map((brand) => (
              <label
                key={brand}
                className="block mb-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={filters.brand.includes(brand)}
                  onChange={() => toggleFilter("brand", brand)}
                  className="mr-2 accent-indigo-500"
                />
                {brand}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-white mb-2">Size</h3>
            {uniqueSizes.map((size) => (
              <label
                key={size}
                className="block mb-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={filters.size.includes(size)}
                  onChange={() => toggleFilter("size", size)}
                  className="mr-2 accent-indigo-500"
                />
                {size}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-white mb-2">Price Range</h3>
            {priceRanges.map((pr) => (
              <label
                key={pr.value}
                className="block mb-2 cursor-pointer select-none"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.priceRange === pr.value}
                  onChange={() => toggleFilter("priceRange", pr.value)}
                  className="mr-2 accent-indigo-500 appearance-radio"
                />
                {pr.label}
              </label>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={resetFilters}
              className="flex-grow bg-gray-700 rounded-md py-2 hover:bg-gray-600 transition text-white"
            >
              Reset
            </button>
            <button
              onClick={applyFiltersAndSort}
              className="flex-grow bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 transition"
            >
              Apply
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-white">
            Trending Products
          </h2>
          <div className="grid grid-cols-2 gap-[2px] md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const stock = getTotalStock(p.stock);
              const isOutOfStock = stock <= 0;
              // const sizes =
                Array.isArray(p.stock) && p.stock.length > 0
                  ? p.stock
                      .filter((s) => !!s.size)
                      .map((s) => s.size)
                      .join(", ")
                  : "-";
              const reviews = Array.isArray(p.reviews) ? p.reviews : [];
              const rating = 5;
                // ? Math.round(
                //     reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
                //   )
                // : 0;

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
                      className="text-base font-bold truncate hover:underline cursor-pointer"
                      title={p.name}
                      onClick={() =>
                        !isOutOfStock && navigate(`/single-product/${p._id}`)
                      }
                    >
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-300">{p.miniDesc}</div>

                    <div className="flex items-center text-yellow-400">
                      {Array(rating)
                        .fill()
                        .map((_, i) => (
                          <Star key={i} size={12} />
                        ))}
                      <span className="ml-1 text-gray-400 text-xs">
                        ({5})
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
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 shadow-inner border-t border-gray-800 flex md:hidden z-50">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-white"
          aria-label="Open Filter options"
        >
          <SlidersHorizontal size={16} /> Filter
        </button>
        <button
          onClick={() => setShowSortModal(true)}
          className="flex-1 py-3 flex items-center justify-center gap-2 font-semibold border-l text-white"
          aria-label="Open Sort options"
        >
          <ArrowUpDown size={16} /> Sort
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
          <div className="bg-gray-900 w-3/4 p-4 flex flex-col relative overflow-y-auto max-h-full">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-2 right-2 text-gray-300 hover:text-white"
              aria-label="Close filter"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Filters</h3>
            <div>
              <h4 className="font-semibold mb-2 text-white">Category</h4>
              {uniqueCategories.map((cat) => (
                <label
                  key={cat}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.category.includes(cat)}
                    onChange={() => toggleFilter("category", cat)}
                    className="mr-2 accent-indigo-500"
                  />
                  {cat}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Brand</h4>
              {uniqueBrands.map((brand) => (
                <label
                  key={brand}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.brand.includes(brand)}
                    onChange={() => toggleFilter("brand", brand)}
                    className="mr-2 accent-indigo-500"
                  />
                  {brand}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Size</h4>
              {uniqueSizes.map((size) => (
                <label
                  key={size}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={filters.size.includes(size)}
                    onChange={() => toggleFilter("size", size)}
                    className="mr-2 accent-indigo-500"
                  />
                  {size}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-white">Price Range</h4>
              {priceRanges.map((pr) => (
                <label
                  key={pr.value}
                  className="block mb-2 cursor-pointer select-none text-gray-300"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={filters.priceRange === pr.value}
                    onChange={() => toggleFilter("priceRange", pr.value)}
                    className="mr-2 accent-indigo-500 appearance-radio"
                  />
                  {pr.label}
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={resetFilters}
                className="flex-1 bg-gray-700 rounded-md py-2 hover:bg-gray-600 text-white transition"
              >
                Reset
              </button>
              <button
                onClick={applyFiltersAndSort}
                className="flex-1 bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Modal */}
      {showSortModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl shadow-lg p-5 max-h-[50vh] overflow-y-auto relative">
            <button
              onClick={() => setShowSortModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white"
              aria-label="Close sort"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Sort</h3>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border border-gray-700 bg-gray-900 text-white rounded p-2 mb-4 outline-none"
              aria-label="Sort products"
            >
              <option value="">None</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="nameAZ">Name: A to Z</option>
              <option value="nameZA">Name: Z to A</option>
            </select>
            <button
              onClick={applyFiltersAndSort}
              className="w-full bg-indigo-700 text-white rounded-md py-2 hover:bg-indigo-800 transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <section className="py-12 px-4 sm:px-6 bg-black/80 text-center text-white max-w-screen-xl mx-auto">
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

      {/* Floating Go to Top button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 right-5 z-50 bg-indigo-700 hover:bg-indigo-900 text-white p-3 rounded-full shadow-lg transition"
          aria-label="Go to top"
        >
          <ArrowUp size={22} />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center py-4 mt-auto select-none text-sm">
        © {new Date().getFullYear()} SV ASTRO PRIVATE LIMITED. All rights
        reserved.
      </footer>
    </div>
  );
};

export default Home;

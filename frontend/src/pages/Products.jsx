import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Heart,
  CreditCard,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import Footer from "../components/Footer";
import GoToTopButton from "@/components/ui/GoToTopButton";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    size: [],
    priceRange: "",
  });
  const [sortOption, setSortOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const navigate = useNavigate();

  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  // Unique filter options
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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        toast.error("❌ Error fetching products!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Search and filtering combined
  useEffect(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    if (sortOption === "priceLowHigh") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "priceHighLow") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === "nameAZ") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "nameZA") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFilteredProducts(result);
  }, [searchQuery, filters, sortOption, products]);

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

  // Reset all filters
  const resetFilters = () => {
    setFilters({ category: [], brand: [], size: [], priceRange: "" });
    setSortOption("");
    setFilteredProducts(products);
  };

  const handleAddToCart = (product) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
      navigate("/login");
      return;
    }
    navigate(`/single-product/${product._id}`);
  };

  const handleBuyNow = (product) => {
    navigate(`/single-product/${product._id}`);
  };

  const handleWishlistToggle = (product) => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your wishlist!");
      return;
    }
    if (wishlist.some((w) => w._id === product._id)) {
      removeFromWishlist(product._id);
      toast.success("❤️ Removed from Loved It!");
    } else {
      addToWishlist(product);
      toast.success("❤️ Added to Loved It!");
    }
  };

  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-b from-black via-black to-indigo-900 text-white font-poppins">
        {/* Header & Search */}
        <div className="container mx-auto p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold text-white">Products</h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full border border-gray-600 bg-gray-800/80 text-white p-2 pl-10 rounded-md shadow focus:ring-2 focus:ring-yellow-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 flex max-w-full">
          {/* Desktop Filters/Sort Sidebar */}
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
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1">
            {loading ? (
              <p className="text-center text-white text-xl mt-16">
                Loading products...
              </p>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const totalStock = Array.isArray(product.stock)
                    ? product.stock.reduce(
                        (sum, v) => sum + (v.quantity || 0),
                        0
                      )
                    : 0;
                  const fakeRating = 5; // static 5-star
                  const reviewCount = 5; // static count
                  const isOutOfStock = totalStock === 0;

                  return (
                    <div
                      key={product._id}
                      className={`w-full bg-gray-800/80 border border-gray-700 rounded-lg p-4 relative flex flex-col justify-between transition hover:shadow-xl ${
                        isOutOfStock
                          ? "opacity-60 pointer-events-none grayscale"
                          : "hover:scale-[1.02]"
                      }`}
                      style={{
                        boxShadow: "0 1px 0 0 #232323, 1px 0 0 0 #232323",
                      }}
                    >
                      {/* Wishlist */}
                      <button
                        onClick={() => handleWishlistToggle(product)}
                        className="absolute top-3 right-3 bg-gray-800/90 p-1 rounded-full shadow hover:bg-gray-700 z-10"
                        aria-label="Toggle wishlist"
                      >
                        <Heart
                          size={20}
                          className={
                            wishlist.some((w) => w._id === product._id)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-400"
                          }
                        />
                      </button>

                      {/* Image */}
                      <div
                        className="pt-[80%] relative overflow-hidden rounded-md cursor-pointer"
                        onClick={() =>
                          !isOutOfStock &&
                          navigate(`/single-product/${product._id}`)
                        }
                      >
                        <img
                          src={product.image?.[0]}
                          alt={product.name}
                          className={`absolute inset-0 w-full h-full object-contain ${
                            isOutOfStock
                              ? "grayscale pointer-events-none"
                              : "hover:scale-105 transition-transform duration-300"
                          }`}
                        />
                      </div>

                      {/* Info */}
                      <div className="mt-3 flex-1">
                        <h3
                          className="text-lg font-semibold line-clamp-2 text-white cursor-pointer"
                          onClick={() =>
                            !isOutOfStock &&
                            navigate(`/single-product/${product._id}`)
                          }
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                          Brand: {product.brand} | Category: {product.category}
                        </p>
                        <p className="text-sm text-gray-400 mb-1 pt-1">
                          {product?.miniDesc}
                        </p>
                        <p className="text-xl font-bold mb-1 text-white">
                          ₹{product.price}
                        </p>
                        <p
                          className={`text-sm font-medium mb-2 ${
                            isOutOfStock ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : "In Stock"}
                        </p>

                        <div className="flex items-center text-yellow-300">
                          {Array(fakeRating)
                            .fill()
                            .map((_, i) => (
                              <Star key={i} size={16} />
                            ))}
                          <span className="ml-1 text-gray-400 text-sm">
                            ({reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black rounded-md hover:from-yellow-600 hover:to-yellow-800 transition disabled:bg-gray-600"
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          disabled={isOutOfStock}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black rounded-md hover:from-yellow-600 hover:to-yellow-800 transition disabled:bg-gray-600"
                        >
                          <CreditCard size={16} /> Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-white text-xl mt-16">
                No products found.
              </p>
            )}
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
                onClick={() => {
                  setShowSortModal(false);
                }}
                className="w-full bg-indigo-700 text-white rounded-md py-2 hover:bg-indigo-800 transition"
              >
                Apply
              </button>
            </div>
          </div>
        )}

  <GoToTopButton/>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default Products;

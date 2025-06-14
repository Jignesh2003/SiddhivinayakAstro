import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Heart,
  CreditCard,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import assets from "../assets/assets";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { addToWishlist, removeFromWishlist, wishlist } =
    useWishlistStore();
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_BASE_URL}/products`
        );
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        toast.error("❌ Error fetching products!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
      return;
    }

                          navigate(`/single-product/${product._id}`)

  };

  const handleBuyNow = async (product) => {
                      navigate(`/single-product/${product._id}`)
  };

  const handleWishlistToggle = (product) => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your wishlist!");
      return;
    }
    if (wishlist.some((w) => w._id === product._id)) {
      removeFromWishlist(product._id);
      toast.success("❤️ Removed from Loved It! ❤️");
    } else {
      addToWishlist(product);
      toast.success("❤️ Added to Loved It! ❤️");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
      }}
    >
      <div className="container mx-auto p-6">
        {/* Header & Search */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Products</h2>
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-300 p-2 pl-10 rounded-md bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-yellow-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-3 top-3 text-gray-500"
              size={18}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-white text-center col-span-full">
              Loading products...
            </p>
          ) : filtered.length > 0 ? (
            filtered.map((product) => {
              // safe reviews
              const reviewCount = product.reviews?.length || 0;
              const avgRating = reviewCount
                ? Math.round(
                    product.reviews.reduce(
                      (sum, r) => sum + r.rating,
                      0
                    ) / reviewCount
                  )
                : 0;

              // total stock
              const totalStock = product.stock.reduce(
                (sum, v) => sum + (v.quantity || 0),
                0
              );

              return (
                <div
                  key={product._id}
                  className="bg-white shadow-lg rounded-lg p-4 relative transition hover:scale-105 duration-300 flex flex-col justify-between"
                >
                  {/* Wishlist */}
                  <button
                    onClick={() => handleWishlistToggle(product)}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
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

                  {/* Image (object-contain ensures the full image fits inside) */}
                  <img
                    src={product?.image?.[0]}
                    alt={product.name}
                    className="w-full h-64 object-contain rounded-md cursor-pointer"
                    onClick={() =>
                      navigate(`/single-product/${product._id}`)
                    }
                  />

                  {/* Info */}
                  <div className="mt-3 flex-1">
                    <h3 className="text-lg font-semibold">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                      Brand: {product.brand} | Category:{" "}
                      {product.category} / {product.subcategory}
                    </p>
                    <p className="text-gray-800 font-bold mb-1">
                      ₹{product.price}
                    </p>

                    {/* Stock status */}
                    <p
                      className={
                        totalStock === 0
                          ? "text-red-600 font-semibold"
                          : "text-green-600 font-semibold"
                      }
                    >
                      {totalStock === 0 ? "Out of Stock" : "In Stock"}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-yellow-500 mt-2">
                      {Array(avgRating)
                        .fill()
                        .map((_, i) => (
                          <Star key={i} size={16} />
                        ))}
                      <span className="text-gray-600 text-sm">
                        ({reviewCount} review
                        {reviewCount !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={totalStock === 0}
                      className="flex-1 bg-yellow-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-yellow-600 transition disabled:bg-gray-400"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                    <button
                      onClick={() => handleBuyNow(product)}
                      disabled={totalStock === 0}
                      className="flex-1 bg-purple-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400"
                    >
                      <CreditCard size={16} /> Buy Now
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-white text-center col-span-full">
              No products found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

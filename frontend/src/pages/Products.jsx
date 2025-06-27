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
import Footer from "../components/Footer"; // ✅ make sure this path is correct

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        setProducts(await res.json());
      } catch (err) {
        toast.error("❌ Error fetching products!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    if (!userId) {
      logout();
      toast.error("Please log in first!");
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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="relative min-h-screen">
        {/* Blurred background */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-md scale-110"
          style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
        />

        {/* Content overlay */}
        <div className="relative z-10 bg-black/60 backdrop-blur-sm min-h-screen pb-12">
          <div className="container mx-auto p-6">
            {/* Header & Search */}
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

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-center col-span-full text-white">
                  Loading products...
                </p>
              ) : filtered.length > 0 ? (
                filtered.map((product) => {
                  const reviewCount = product.reviews?.length || 0;
                  const avgRating = reviewCount
                    ? Math.round(
                        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviewCount
                      )
                    : 0;
                  const totalStock = Array.isArray(product.stock)
                    ? product.stock.reduce(
                        (sum, v) => sum + (v.quantity || 0),
                        0
                      )
                    : 0;

                  return (
                    <div
                      key={product._id}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-lg p-4 relative flex flex-col justify-between transition hover:shadow-xl"
                    >
                      {/* Wishlist */}
                      <button
                        onClick={() => handleWishlistToggle(product)}
                        className="absolute top-3 right-3 bg-gray-800/90 p-1 rounded-full shadow hover:bg-gray-700 z-10"
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
                          navigate(`/single-product/${product._id}`)
                        }
                      >
                        <img
                          src={product.image?.[0]}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>

                      {/* Info */}
                      <div className="mt-3 flex-1">
                      <b>    <h3 className="text-lg font-semibold line-clamp-2 text-white">
                          {product.name}
                        </h3></b>
                        <p className="text-sm text-gray-400 mb-1">
                          Brand: {product.brand} | Category: {product.category}
                        </p>
                     <b> <p className="text-sm text-gray-400 mb-1 pt-1">
                           {product?.miniDesc} 
                        </p></b>
                        <p className="text-xl font-bold mb-1 text-white">
                          ₹{product.price}
                        </p>
                        <p
                          className={`text-sm font-medium mb-2 ${
                            totalStock === 0
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {totalStock === 0 ? "Out of Stock" : "In Stock"}
                        </p>
                        <div className="flex items-center gap-1 text-yellow-300">
                          {Array(avgRating)
                            .fill()
                            .map((_, i) => (
                              <Star key={i} size={16} />
                            ))}
                          <span className="text-gray-400 text-sm">
                            ({reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={totalStock === 0}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black rounded-md hover:from-yellow-600 hover:to-yellow-800 transition disabled:bg-gray-600"
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          disabled={totalStock === 0}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black rounded-md hover:from-yellow-600 hover:to-yellow-800 transition disabled:bg-gray-600"
                        >
                          <CreditCard size={16} /> Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center col-span-full text-white">
                  No products found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Persistent Footer Below Product Grid */}
      <Footer />
    </>
  );
};

export default Products;

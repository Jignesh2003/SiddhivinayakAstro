import { useState, useEffect } from "react";
import { ShoppingCart, Search, Heart, CreditCard, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import useWishlistStore from "../store/useWishlistStore";
import assets from "../assets/assets";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const addToCart = useCartStore((state) => state.addToCart);
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlistStore();
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {logout} = useAuthStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        toast.error("❌ Error fetching products!");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!userId) {
      logout()
      toast.error("Please log in first!");
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
      return;
    }

    if (wishlist.some((item) => item._id === product._id)) {
      removeFromWishlist(product._id);
      toast.success("❤️ Removed from Loved It! ❤️");
    } else {
      addToWishlist(product);
      toast.success("❤️ Added to Loved It! ❤️");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <div className="container mx-auto p-6">
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
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-white text-center col-span-full">Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product._id} className="bg-white shadow-lg rounded-lg p-4 relative transition hover:scale-105 duration-300 flex flex-col justify-between">
                <button onClick={() => handleWishlistToggle(product)} className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition">
                  <Heart size={20} className={wishlist.some((item) => item._id === product._id) ? "text-red-500 fill-red-500" : "text-gray-400"} />
                </button>

                <img src={product.image} alt={product.name} className="w-full h-80 object-cover rounded-md cursor-pointer" onClick={() => navigate(`/single-product/${product._id}`)} />

                <div className="min-h-[60px] mt-3">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-600">₹{product.price}</p>
                  <p className={product.stock === 0 ? "text-red-600 font-semibold" : product.stock < 10 ? "text-red-500" : "text-green-600"}>
                    {product.stock === 0 ? "Out of Stock" : `Stock: ${product.stock}`}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array(Math.round(product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length || 0)).fill().map((_, i) => <Star key={i} size={16} />)}
                    <span className="text-gray-600 text-sm">({product.reviews.length} reviews)</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-yellow-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-yellow-600 transition disabled:bg-gray-400" onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button className="flex-1 bg-purple-500 text-white flex items-center justify-center gap-2 py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400" onClick={() => handleBuyNow(product)} disabled={product.stock === 0}>
                    <CreditCard size={16} /> Buy Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white text-center col-span-full">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

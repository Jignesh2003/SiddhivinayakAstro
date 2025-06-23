import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, CreditCard } from "lucide-react";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";
import { toast } from "react-toastify";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import assets from "../assets/assets";

// Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
// Swiper modules (correct v11+ import)
import { Navigation, Pagination } from "swiper/modules";
// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const SingleProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [products, setProducts] = useState([]);

  const addToCart = useCartStore((state) => state.addToCart);
  const { userId, token, logout } = useAuthStore();

  // Fetch single product
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/products/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProduct(data);
        setReviews(
          (data.reviews || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
        if (data.sizeType !== "Quantity" && data.stock.length > 0) {
          setSelectedSize(data.stock[0].size);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // Fetch all products for carousel
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/products`);
        const json = await res.json();
        setProducts(json);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        Loading product...
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex justify-center items-center h-64 text-white">
        Product not found.
      </div>
    );
  }

  const totalStock = product.stock.reduce((sum, v) => sum + v.quantity, 0);
  const variant = product.stock.find((v) => v.size === selectedSize);
  const selectedStock = variant?.quantity || 0;

  const handleAddToCart = async () => {
    if (!userId) {
      toast.error("Please log in first!");
      logout();
      return navigate("/login");
    }
    if (product.sizeType !== "Quantity" && !selectedSize) {
      return toast.error("Please select a size!");
    }
    if (product.sizeType !== "Quantity" && selectedStock === 0) {
      return toast.error(`Size ${selectedSize} is out of stock!`);
    }
    if (product.sizeType === "Quantity" && totalStock === 0) {
      return toast.error("Out of stock!");
    }
    try {
      await addToCart({
        product: product._id,
        size: selectedSize,
        quantity: 1,
      });
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart.");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const galleryImages = product.image.map((img) => ({
    original: img,
    thumbnail: img,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${assets.GalaxyBackground})`,
          filter: "blur(8px)",
          zIndex: -1,
        }}
      />
      <div className="absolute inset-0 bg-opacity-60 backdrop-blur-md z-0" />

      {/* Main Content */}
      <div className="relative z-10 text-white py-10 px-4 md:px-10">
        <div className="max-w-6xl mx-auto bg-black bg-opacity-70 backdrop-blur-md rounded-lg shadow-xl p-6">
          
          {/* Product Details */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
              <ImageGallery
                items={galleryImages}
                showPlayButton={false}
                showFullscreenButton
                showNav
                slideDuration={200}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-sm text-gray-300 mb-4">
                Brand: <span className="font-medium">{product.brand}</span> | Category:{" "}
                <span className="font-medium">{product.category}</span>
              </p>
              <p className="text-md text-gray-100 mb-4">{product.description}</p>
              <p className="text-2xl font-semibold text-yellow-400 mb-2">
                ₹{product.price}
              </p>
              <p className={`mb-4 font-semibold ${totalStock ? "text-green-400" : "text-red-500"}`}>
                {totalStock ? "In Stock" : "Out of Stock"}
              </p>

              {product.sizeType !== "Quantity" && (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Select {product.sizeType}:
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="bg-white text-black border rounded p-2 w-full"
                  >
                    {product.stock.map((v) => (
                      <option key={v._id} value={v.size}>
                        {v.size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {avgRating && (
                <div className="flex items-center mb-6">
                  <span className="text-xl font-medium mr-2">{avgRating}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Star
                        key={val}
                        size={20}
                        className={val <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-600"}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400 ml-2">
                    ({reviews.length} review{reviews.length !== 1 && "s"})
                  </span>
                </div>
              )}

              <div className="flex gap-4 mt-auto">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    (product.sizeType !== "Quantity" && selectedStock === 0) ||
                    (product.sizeType === "Quantity" && totalStock === 0)
                  }
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={
                    (product.sizeType !== "Quantity" && selectedStock === 0) ||
                    (product.sizeType === "Quantity" && totalStock === 0)
                  }
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  <CreditCard size={20} /> Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Customer Reviews</h2>
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div
                  key={r._id}
                  className="border border-gray-700 rounded-lg p-4 mb-4 bg-black bg-opacity-60"
                >
                  {r.userId && (
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={r.userId.avatar || "/user-avatar.png"}
                        alt={r.userId.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-medium text-sm text-white">{r.userId.name}</span>
                    </div>
                  )}
                  <div className="flex items-center mb-2">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-400" size={18} />
                    ))}
                  </div>
                  {r.text && <p className="text-gray-100 mb-2">{r.text}</p>}
                  {r.media && (
                    <img
                      src={r.media}
                      onError={(e) => (e.target.src = "/fallback.jpg")}
                      alt="Review media"
                      className="w-32 h-32 object-contain rounded-md"
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No reviews yet.</p>
            )}
          </div>

          {/* “You Might Also Like” Carousel */}
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">You Might Also Like</h2>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={20}
              slidesPerView={3}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
            >
              {products
                .filter((p) => p._id !== product._id)
                .map((p) => (
                  <SwiperSlide key={p._id}>
                    <div
                      onClick={() => navigate(`/single-product/${p._id}`)}
                      className="cursor-pointer bg-gray-900 rounded-lg overflow-hidden"
                    >
                      <img
                        src={p.image[0]}
                        alt={p.name}
                        className="w-full h-70 object-fit"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-white truncate">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-yellow-400 font-semibold">
                          ₹{p.price}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;

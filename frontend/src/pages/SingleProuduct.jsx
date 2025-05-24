import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, CreditCard } from "lucide-react";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";
import { toast } from "react-toastify";

const SingleProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const addToCart = useCartStore((state) => state.addToCart);
  const { userId, token ,logout} = useAuthStore();
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProduct(response.data);
        setReviews(response.data.reviews || []);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, token]); // ✅ Added `token` dependency for security

  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("Please log in first!");
      logout()
      return navigate("/login");
    }
    if (product.stock === 0) {
      toast.error("Out of stock!");
      return;
    }
    await addToCart(product, userId, 1);
    toast.success("Added to cart!");
  };

  const handleBuyNow = async (product) => {
    await handleAddToCart(product); // Adds to cart first
    navigate("/cart"); // Redirect to the cart page
  };

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found.</p>;

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "No Ratings";

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={product.image}
          alt={product.name}
          className="w-full md:w-1/2 h-80 object-cover rounded-md"
        />
        <div>
          <h2 className="text-3xl font-bold">{product.name}</h2>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p className="text-lg font-semibold mt-3">Price: ₹{product.price}</p>

          {/* ⭐ Display Average Rating */}
          <p className="mt-2 flex items-center text-yellow-500">
            ★ {averageRating}
          </p>

          {/* Add to Cart and Buy Now Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 flex items-center gap-2"
              onClick={() => handleAddToCart(product)}
              disabled={product.stock === 0}
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 flex items-center gap-2"
              onClick={() => handleBuyNow(product)}
              disabled={product.stock === 0}
            >
              <CreditCard size={16} /> Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold">Reviews</h3>
        <div className="mt-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="border p-4 rounded-md mb-4">
                <p>{review.text}</p>
                <div className="flex items-center text-yellow-500">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={16} />
                  ))}
                </div>
                {review.media && (
                  <img
                    src={review.media}
                    alt="Review Media"
                    className="mt-2 w-32 h-32 object-cover rounded-md"
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;

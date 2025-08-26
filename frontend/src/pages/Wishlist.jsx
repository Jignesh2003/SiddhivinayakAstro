import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useWishlistStore from "../store/useWishlistStore";
import assets from "@/assets/assets";
// import useAuthStore from "../store/useAuthStore";

const Wishlist = () => {
  const { wishlist, removeFromWishlist, fetchWishlist, loading } = useWishlistStore();
  // const { userId } = useAuthStore.getState(); // still available if needed
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist(); // Fetch wishlist on mount
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-100 py-10 px-4"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        // filter: "blur(8px)",
        zIndex: -1,
      }}
    >
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your Wishlist</h2>

        {/* Spinner when loading */}
        {loading && (
          <div className="flex justify-center items-center my-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {wishlist.length === 0 ? (
          <p className="text-gray-600">
            Your wishlist is empty.{" "}
            <Link to="/products" className="text-blue-500">
              Start Shopping
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <img
                  src={product?.image?.[0]}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
                <p className="text-gray-600">Rs {product.price}</p>
                <div className="flex mt-3 gap-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => navigate(`/single-product/${product._id}`)}
                  >
                    Show Product
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                    onClick={() => removeFromWishlist(product._id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

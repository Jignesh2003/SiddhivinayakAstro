import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import assets from "@/assets/assets";

function HowToWearList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/products`
        );
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading)
    return <div className="text-center py-10">Loading products...</div>;

  if (products.length === 0)
    return (
      <p className="text-center py-10 text-gray-600">No products found.</p>
    );

  return (
    <div
      className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        zIndex: -1,
      }}
    >
      {products.map((product) => (
        <div
          key={product._id}
          className="bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col hover:shadow-yellow-500 transition-shadow"
        >
          <Link
            to={`/single-product/${product._id}`}
            className="flex flex-col flex-grow"
          >
            {/* Product Image */}
            {product.image && product.image.length > 0 && (
              <img
                src={product.image[0]}
                alt={product.name}
                className="h-48 w-full object-contain rounded mb-4"
              />
            )}

            {/* Name and Price */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-yellow-400">
                {product.name}
              </h2>
              <span className="text-yellow-400 font-semibold text-lg">
                ₹{product.price}
              </span>
            </div>

            {/* Mini Description */}
            {product.miniDesc && (
              <p className="text-gray-400 text-sm mb-2">{product.miniDesc}</p>
            )}

            {/* Full Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-4">
              {product.description}
            </p>

            {/* How to Wear */}
            {product.howToWear && product.howToWear.length > 0 && (
              <div className="mb-3">
                <h3 className="text-lg font-semibold mb-1 border-b border-yellow-400 pb-1 text-yellow-300">
                  How to Wear
                </h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                  {product.howToWear.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="mb-3">
                <h3 className="text-lg font-semibold mb-1 border-b border-yellow-400 pb-1 text-yellow-300">
                  Benefits
                </h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                  {product.benefits.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best Day to Wear */}
            {product.bestDayToWear && product.bestDayToWear.length > 0 && (
              <div className="mb-3">
                <h3 className="text-lg font-semibold mb-1 border-b border-yellow-400 pb-1 text-yellow-300">
                  Best Day to Wear
                </h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                  {product.bestDayToWear.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default HowToWearList;

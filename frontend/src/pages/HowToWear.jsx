import { useState, useEffect } from "react";
import axios from "axios";

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
console.log(products);

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.length === 0 && <p>No products found.</p>}
      {products.map((product) => (
        <div
          key={product._id}
          className="border rounded shadow p-4 flex flex-col space-y-3"
        >
          {/* Product Image */}
          {product.image && product.image.length > 0 && (
            <img
              src={product.image[0]}
              alt={product.name}
              className="h-48 w-full object-contain rounded"
            />
          )}

          {/* Product Name & Price */}
          <div className="text-lg font-semibold flex justify-between items-center">
            <span>{product.name}</span>
            <span className="text-yellow-600 font-bold">₹{product.price}</span>
          </div>

          {/* Mini Description */}
          {product.miniDesc && (
            <p className="text-gray-600 text-sm">{product.miniDesc}</p>
          )}

          {/* Full Description */}
          <p className="text-gray-700 text-sm">{product.description}</p>
          <p className="text-gray-700 text-sm">{product.howToWear}</p>

          {/* How To Wear */}
          {product.howToWear && product.howToWear.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">How to Wear</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                {product.howToWear.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default HowToWearList;
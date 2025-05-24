import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
    image: null,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Handle Edit Click
  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock,
      image: product.image, // Store existing image URL
    });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, image: files[0] }); // File input
    } else {
      setFormData({ ...formData, [name]: value }); // Text input
    }
  };

  // Save edited product
  const handleSave = async (id) => {
    try {
      const { token } = useAuthStore.getState();
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("stock", formData.stock);

      // Append new image only if selected
      if (formData.image && typeof formData.image !== "string") {
        formDataToSend.append("image", formData.image);
      }

      await axios.put(`${import.meta.env.VITE_BASE_URL}/products/${id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error.response ? error.response.data : error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Products</h2>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Image</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id} className="text-center">
              {/* Product Name */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="border p-1" />
                ) : (
                  product.name
                )}
              </td>

              {/* Product Price */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="border p-1" />
                ) : (
                  `₹${product.price}`
                )}
              </td>

              {/* Product Stock */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="border p-1" />
                ) : (
                  product.stock
                )}
              </td>

              {/* Product Description */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="border p-1 w-full" />
                ) : (
                  product.description
                )}
              </td>

              {/* Product Image */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="file" name="image" accept="image/*" onChange={handleInputChange} className="border p-1" />
                ) : (
                  <img src={product.image} alt={product.name} className="h-16 mx-auto" />
                )}
              </td>

              {/* Actions */}
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <button onClick={() => handleSave(product._id)} className="bg-green-500 text-white px-3 py-1 rounded">Save</button>
                ) : (
                  <button onClick={() => handleEditClick(product)} className="bg-blue-500 text-white px-3 py-1 rounded">Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProducts;

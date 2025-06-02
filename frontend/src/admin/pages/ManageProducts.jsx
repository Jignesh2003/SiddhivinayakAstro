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

  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock,
      image: product.image, // preserve current image URL
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (id) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("stock", formData.stock);

      // Only add new image if user selected a file
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchProducts(); // Refresh product list
    } catch (error) {
      console.error("Error deleting product:", error.response ? error.response.data : error);
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
              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="border p-1" />
                ) : (
                  product.name
                )}
              </td>

              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="border p-1" />
                ) : (
                  `₹${product.price}`
                )}
              </td>

              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="border p-1" />
                ) : (
                  product.stock
                )}
              </td>

              <td className="border p-2">
                {editingProduct === product._id ? (
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="border p-1 w-full" />
                ) : (
                  product.description
                )}
              </td>

              <td className="border p-2">
                {editingProduct === product._id ? (
                  <input type="file" name="image" accept="image/*" onChange={handleInputChange} className="border p-1" />
                ) : (
                  <img src={product.image} alt={product.name} className="h-16 mx-auto" />
                )}
              </td>

              <td className="border p-2 flex justify-center gap-2">
                {editingProduct === product._id ? (
                  <button onClick={() => handleSave(product._id)} className="bg-green-500 text-white px-3 py-1 rounded">
                    Save
                  </button>
                ) : (
                  <button onClick={() => handleEditClick(product)} className="bg-blue-500 text-white px-3 py-1 rounded">
                    Edit
                  </button>
                )}
                <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProducts;

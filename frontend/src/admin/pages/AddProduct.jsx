import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("image", image);
    formData.append("stock", stock);
    formData.append("description", description);


    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/add-product`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
     toast.success("Product added successfully!", { position: "top-right" });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Add Product</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded mb-2" required />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded mb-2" required />
        <input type="number" placeholder="Stocks" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-2 rounded mb-2" required />

        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded mb-2" required />

        <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full border p-2 rounded mb-2" required />
        <button type="submit" className="bg-yellow-500 text-white py-2 px-4 rounded w-full hover:bg-yellow-600 transition">
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;

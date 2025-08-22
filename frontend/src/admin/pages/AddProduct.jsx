import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";
import { Pen } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Gifts",
  "Gemstones",
  "Necklaces",
  "Rings",
  "Bracelets",
  "Puja samagri",
  "Turtle",
  "Rudraksha",
  "Murti",
  "Kavach",
  "Siddh Rudraksha",
  "Yantras",
  "Evil Eye",
  "Combos",
  "Pyrite",
  "Pendants",
  "Money_Magnet",
  "Customized",
];

const SUBCATEGORY_OPTIONS = {
  Gifts: ["Birthday", "Anniversary", "Housewarming"],
  Gemstones: ["Precious", "Semi-Precious"],
  Necklaces: ["Pendant", "Chains", "Choker"],
  Rings: ["Wedding", "Fashion", "Engagement"],
  Bracelets: ["Beaded", "Copper", "Silver"],
  "Puja samagri": ["Incense", "Puja Thali", "Dhoop"],
  Turtle: ["Small", "Medium", "Large"],
  Rudraksha: ["1 Mukhi", "2 Mukhi", "3 Mukhi", "5 Mukhi", "7 Mukhi"],
  Siddh_Rudraksha: ["Gauri Shankar", "Trijuti", "Navratna"],
  Kavach: ["Gold", "Silver", "Copper"],
  Yantras: ["Kuber Yantra", "Shree Yantra", "Maha Lakshmi Yantra"],
  Evil_Eye: ["Bracelet", "Necklace", "Keychain"],
  Pyrite: ["Raw", "Tumbled", "Jewelry"],
  Pendants: ["Gold", "Silver", "Gemstone"],
  Money_Magnet: ["Coins", "Bills", "Charms"],
  Customized: ["Engraving", "Personalized Text", "Photo Print"],
};

const SIZE_TYPE_OPTIONS = ["Ring","Quantity","Mukhi","Gemstone"];
const SIZE_OPTIONS = {
  Ring:       ["3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13"],
  Quantity:   [],
  Mukhi:      ["1 Mukhi","2 Mukhi","3 Mukhi","4 Mukhi","5 Mukhi","6 Mukhi","7 Mukhi","8 Mukhi","9 Mukhi","10 Mukhi","11 Mukhi","12 Mukhi","13 Mukhi","14 Mukhi"],
  Gemstone:   ["Amethyst","Rose Quartz","Citrine","Emerald","Ruby","Sapphire","Garnet","Turquoise","Topaz","Peridot"],
};

export default function AddProduct() {
  const token = useAuthStore(s => s.token);

  const [form, setForm] = useState({
    name:        "",
    price:       "",
    description: "",
    miniDesc:    "",
    tags:        "",
    category:    CATEGORY_OPTIONS[0],
    subcategory: SUBCATEGORY_OPTIONS[CATEGORY_OPTIONS[0]][0],
    brand:       "",
    sizeType:    SIZE_TYPE_OPTIONS[0],
    stockRows:   [{ size: "", quantity: "" }],
  });
  const [files, setFiles]       = useState([]);       // File[]
  const [previews, setPreviews] = useState([]);       // data URIs
  const [loading, setLoading]   = useState(false);

  // whenever category changes, reset subcategory to first option
  useEffect(() => {
    const subs = SUBCATEGORY_OPTIONS[form.category] || [];
    setForm(f => ({ ...f, subcategory: subs[0] || "" }));
  }, [form.category]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleStockChange = (idx, field, val) => {
    setForm(f => {
      const rows = [...f.stockRows];
      rows[idx][field] = val;
      return { ...f, stockRows: rows };
    });
  };

  const addStockRow = () =>
    setForm(f => ({
      ...f,
      stockRows: [...f.stockRows, { size: "", quantity: "" }],
    }));

  const removeStockRow = idx =>
    setForm(f => ({
      ...f,
      stockRows: f.stockRows.filter((_, i) => i !== idx),
    }));

  const handleFileSelect = e => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    Promise.all(
      selected.map(file =>
        new Promise(res => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(file);
        })
      )
    ).then(setPreviews);
  };

  const resetForm = () => {
    const defaultCat = CATEGORY_OPTIONS[0];
    setForm({
      name:        "",
      price:       "",
      description: "",
      miniDesc:    "",
      tags:        "",
      category:    defaultCat,
      subcategory: SUBCATEGORY_OPTIONS[defaultCat][0],
      brand:       "",
      sizeType:    SIZE_TYPE_OPTIONS[0],
      stockRows:   [{ size: "", quantity: "" }],
    });
    setFiles([]);
    setPreviews([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // validate stock
    for (let { size, quantity } of form.stockRows) {
      if (form.sizeType !== "Quantity" && !size) {
        toast.error("❌ Please select a size for every row.");
        setLoading(false);
        return;
      }
      if (!quantity) {
        toast.error("❌ Please specify quantity for every row.");
        setLoading(false);
        return;
      }
    }
    if (files.length === 0) {
      toast.error("❌ Please upload at least one image.");
      setLoading(false);
      return;
    }

    // build FormData
    const fd = new FormData();
    fd.append("name",        form.name);
    fd.append("price",       form.price);
    fd.append("description", form.description);
    fd.append("miniDesc",    form.miniDesc);
    const tagsArray = form.tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);
    fd.append("tags",        JSON.stringify(tagsArray));
    fd.append("category",    form.category);
    fd.append("subcategory", form.subcategory);
    fd.append("brand",       form.brand);
    fd.append("sizeType",    form.sizeType);
    fd.append(
      "stock",
      JSON.stringify(
        form.stockRows.map(({ size, quantity }) => ({
          size,
          quantity: Number(quantity),
        }))
      )
    );
    files.forEach(file => fd.append("image", file));

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/add-product`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("✅ Product added successfully!");
      resetForm();
    } catch (err) {
      console.error("Error adding product:", err.response || err);
      toast.error(err.response?.data?.message || "❌ Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Price */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          placeholder="Price (₹)"
          className="w-full border p-2 rounded"
          required
        />

        {/* Category & Subcategory */}
        <div className="flex gap-2">
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="flex-1 border p-2 rounded"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            className="flex-1 border p-2 rounded"
          >
            {(SUBCATEGORY_OPTIONS[form.category] || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Brand & Size Type */}
        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand"
          className="w-full border p-2 rounded"
        />
        <select
          name="sizeType"
          value={form.sizeType}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          {SIZE_TYPE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Stock Details */}
        <div>
          <h3 className="font-semibold mb-2">Stock Details</h3>
          {form.stockRows.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              {form.sizeType !== "Quantity" && (
                <select
                  value={row.size}
                  onChange={e => handleStockChange(idx, "size", e.target.value)}
                  className="flex-1 border p-2 rounded"
                  required
                >
                  <option value="">Select size</option>
                  {SIZE_OPTIONS[form.sizeType].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              <input
                type="number"
                placeholder="Quantity"
                value={row.quantity}
                onChange={e => handleStockChange(idx, "quantity", e.target.value)}
                className="w-24 border p-2 rounded"
                required
              />
              {form.stockRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStockRow(idx)}
                  className="text-red-500 text-xl"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addStockRow}
            className="text-sm text-blue-600"
          >
            + Add another{" "}
            {form.sizeType === "Quantity" ? "quantity" : "size"} row
          </button>
        </div>

        {/* Mini Description */}
        <textarea
          name="miniDesc"
          value={form.miniDesc}
          onChange={handleChange}
          placeholder="Mini Description (short blurb)"
          className="w-full border p-2 rounded"
          rows={2}
        />

        {/* Tags */}
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma-separated)"
          className="w-full border p-2 rounded"
        />

        {/* Full Description */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Full Description"
          className="w-full border p-2 rounded"
          rows={4}
          required
        />

        {/* Image Upload & Preview */}
        <input
          name="image"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="w-full border p-2 rounded"
          required
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Preview ${i}`}
                className="h-24 object-contain border rounded"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          {loading ? "Submitting…" : "Submit Product"}
        </button>
      </form>
    </div>
  );
}

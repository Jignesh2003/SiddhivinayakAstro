import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../../store/useAuthStore";

const CATEGORY_OPTIONS = [
  "Gifts",
  "Gemstones",
  "Necklaces",
  "Rings",
  "Bracelets",
  "Puja Samagri",
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
  "Money Magnet",
  "Pyramids",
  "Home Decor",
  "Stone",
  "Customized",
];

const SUBCATEGORY_OPTIONS = {
  Gifts: ["Birthday", "Anniversary", "Housewarming"],
  Gemstones: ["Precious", "Semi-Precious"],
  Necklaces: ["Pendant", "Chains", "Choker"],
  Rings: ["Wedding", "Fashion", "Engagement"],
  Bracelets: ["Beaded", "Copper", "Silver"],
  "Puja Samagri": ["Incense", "Puja Thali", "Dhoop"],
  Turtle: ["Small", "Medium", "Large"],
  Rudraksha: ["1 Mukhi", "2 Mukhi", "3 Mukhi", "5 Mukhi", "7 Mukhi"],
  "Siddh Rudraksha": ["Gauri Shankar", "Trijuti", "Navratna"],
  Kavach: ["Gold", "Silver", "Copper"],
  Yantras: ["Kuber Yantra", "Shree Yantra", "Maha Lakshmi Yantra"],
  "Evil Eye": ["Bracelet", "Necklace", "Keychain"],
  Pyrite: ["Raw", "Tumbled", "Jewelry"],
  Pyramids: ["Crystal", "Metal", "Decorative"],
  Pendants: ["Gold", "Silver", "Gemstone"],
  "Money Magnet": ["Coins", "Bills", "Charms"],
  "Home Decor": ["Wall Hangings", "Statues", "Feng Shui", "Tree"],
  Customized: ["Engraving", "Personalized Text", "Photo Print"],
};

const SIZE_TYPE_OPTIONS = ["Ring", "Quantity", "Mukhi", "Gemstone"];
const SIZE_OPTIONS = {
  Ring: [
    "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
    "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13",
  ],
  Quantity: [],
  Mukhi: [
    "1 Mukhi", "2 Mukhi", "3 Mukhi", "4 Mukhi", "5 Mukhi", "6 Mukhi",
    "7 Mukhi", "8 Mukhi", "9 Mukhi", "10 Mukhi", "11 Mukhi", "12 Mukhi",
    "13 Mukhi", "14 Mukhi",
  ],
  Gemstone: [
    "Amethyst", "Rose Quartz", "Citrine", "Emerald", "Ruby",
    "Sapphire", "Garnet", "Turquoise", "Topaz", "Peridot",
  ],
};

export default function AddProduct() {
  const token = useAuthStore((s) => s.token);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    miniDesc: "",
    tags: "",
    category: CATEGORY_OPTIONS[0],
    subcategory: SUBCATEGORY_OPTIONS[CATEGORY_OPTIONS[0]][0],
    brand: "",
    sizeType: SIZE_TYPE_OPTIONS[0],
    stockRows: [{ size: "", quantity: "" }],
    howToWear: "",
    benefits: "",
    bestDayToWear: "",
    // NEW: Variant support
    hasVariants: false,
    variantRows: [{ variantName: "", gram: "", price: "", stock: "", sku: "", isDefault: true }],
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subs = SUBCATEGORY_OPTIONS[form.category] || [];
    setForm((f) => ({ ...f, subcategory: subs[0] || "" }));
  }, [form.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Legacy stock handlers
  const handleStockChange = (idx, field, val) => {
    setForm((f) => {
      const rows = [...f.stockRows];
      rows[idx][field] = val;
      return { ...f, stockRows: rows };
    });
  };

  const addStockRow = () =>
    setForm((f) => ({
      ...f,
      stockRows: [...f.stockRows, { size: "", quantity: "" }],
    }));

  const removeStockRow = (idx) =>
    setForm((f) => ({
      ...f,
      stockRows: f.stockRows.filter((_, i) => i !== idx),
    }));

  // NEW: Variant handlers
  const handleVariantChange = (idx, field, val) => {
    setForm((f) => {
      const rows = [...f.variantRows];
      rows[idx][field] = field === "isDefault" ? val : val;
      // If setting this as default, unset others
      if (field === "isDefault" && val) {
        rows.forEach((row, i) => {
          if (i !== idx) row.isDefault = false;
        });
      }
      return { ...f, variantRows: rows };
    });
  };

  const addVariantRow = () =>
    setForm((f) => ({
      ...f,
      variantRows: [
        ...f.variantRows,
        { variantName: "", gram: "", price: "", stock: "", sku: "", isDefault: false },
      ],
    }));

  const removeVariantRow = (idx) =>
    setForm((f) => ({
      ...f,
      variantRows: f.variantRows.filter((_, i) => i !== idx),
    }));

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    Promise.all(
      selected.map(
        (file) =>
          new Promise((res) => {
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
      name: "",
      price: "",
      description: "",
      miniDesc: "",
      tags: "",
      category: defaultCat,
      subcategory: SUBCATEGORY_OPTIONS[defaultCat][0],
      brand: "",
      sizeType: SIZE_TYPE_OPTIONS[0],
      stockRows: [{ size: "", quantity: "" }],
      howToWear: "",
      benefits: "",
      bestDayToWear: "",
      hasVariants: false,
      variantRows: [{ variantName: "", gram: "", price: "", stock: "", sku: "", isDefault: true }],
    });
    setFiles([]);
    setPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Validate based on product type
    if (form.hasVariants) {
      // Validate variants
      for (let variant of form.variantRows) {
        if (!variant.variantName || !variant.price || !variant.stock) {
          toast.error("❌ Please fill all variant fields (name, price, stock).");
          setLoading(false);
          return;
        }
      }
    } else {
      // Validate legacy stock
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
    }

    if (files.length === 0) {
      toast.error("❌ Please upload at least one image.");
      setLoading(false);
      return;
    }

    // Helper to parse comma-separated string to array
    const parseToArray = (str) =>
      str
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    // Build FormData
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("miniDesc", form.miniDesc);
    fd.append("tags", JSON.stringify(parseToArray(form.tags)));
    fd.append("category", form.category.trim());
    fd.append("subcategory", form.subcategory.trim());
    fd.append("brand", form.brand.trim());
    fd.append("howToWear", JSON.stringify(parseToArray(form.howToWear)));
    fd.append("benefits", JSON.stringify(parseToArray(form.benefits)));
    fd.append("bestDayToWear", JSON.stringify(parseToArray(form.bestDayToWear)));

    // NEW: Add variant or legacy fields based on hasVariants
    fd.append("hasVariants", form.hasVariants);

    if (form.hasVariants) {
      // Send variants array
      const variants = form.variantRows.map((v) => ({
        variantName: v.variantName,
        gram: v.gram ? Number(v.gram) : undefined,
        price: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku || undefined,
        isDefault: v.isDefault,
      }));
      fd.append("variants", JSON.stringify(variants));
    } else {
      // Send legacy price, sizeType, stock
      fd.append("price", form.price);
      fd.append("sizeType", form.sizeType.trim());
      fd.append(
        "stock",
        JSON.stringify(
          form.stockRows.map(({ size, quantity }) => ({
            size,
            quantity: Number(quantity),
          }))
        )
      );
    }

    files.forEach((file) => fd.append("image", file));

    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/add-product`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="w-full border p-2 rounded"
          required
        />

        {/* NEW: Has Variants Checkbox */}
        <label className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded">
          <input
            type="checkbox"
            name="hasVariants"
            checked={form.hasVariants}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <span className="font-semibold text-sm">
            This product has multiple variants with different prices
            <span className="block text-xs text-gray-600 mt-1">
              (e.g., 5 Gram @ ₹2500, 10 Gram @ ₹4800)
            </span>
          </span>
        </label>

        {/* Conditional: Variants OR Legacy Price/Stock */}
        {form.hasVariants ? (
          // NEW: Variant Input Section
          <div className="p-4 bg-gray-50 rounded border">
            <h3 className="font-semibold mb-3">Product Variants</h3>
            {form.variantRows.map((row, idx) => (
              <div key={idx} className="mb-4 p-3 bg-white rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Variant #{idx + 1}</span>
                  {form.variantRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="text-red-500 text-xl hover:text-red-700"
                    >
                      &times;
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g., 5 Gram)"
                    value={row.variantName}
                    onChange={(e) =>
                      handleVariantChange(idx, "variantName", e.target.value)
                    }
                    className="border p-2 rounded"
                    required
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Gram (optional)"
                    value={row.gram}
                    onChange={(e) =>
                      handleVariantChange(idx, "gram", e.target.value)
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={row.price}
                    onChange={(e) =>
                      handleVariantChange(idx, "price", e.target.value)
                    }
                    className="border p-2 rounded"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={row.stock}
                    onChange={(e) =>
                      handleVariantChange(idx, "stock", e.target.value)
                    }
                    className="border p-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="SKU (optional)"
                    value={row.sku}
                    onChange={(e) =>
                      handleVariantChange(idx, "sku", e.target.value)
                    }
                    className="border p-2 rounded col-span-2"
                  />
                  <label className="flex items-center gap-2 col-span-2">
                    <input
                      type="checkbox"
                      checked={row.isDefault}
                      onChange={(e) =>
                        handleVariantChange(idx, "isDefault", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Set as default variant</span>
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariantRow}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add another variant
            </button>
          </div>
        ) : (
          // EXISTING: Legacy Price & Stock Section
          <>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="Price (₹)"
              className="w-full border p-2 rounded"
              required
            />

            <select
              name="sizeType"
              value={form.sizeType}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              {SIZE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <div>
              <h3 className="font-semibold mb-2">Stock Details</h3>
              {form.stockRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  {form.sizeType !== "Quantity" && (
                    <select
                      value={row.size}
                      onChange={(e) =>
                        handleStockChange(idx, "size", e.target.value)
                      }
                      className="flex-1 border p-2 rounded"
                      required
                    >
                      <option value="">Select size</option>
                      {SIZE_OPTIONS[form.sizeType].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={row.quantity}
                    onChange={(e) =>
                      handleStockChange(idx, "quantity", e.target.value)
                    }
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
          </>
        )}

        {/* Category & Subcategory */}
        <div className="flex gap-2">
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="flex-1 border p-2 rounded"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            className="flex-1 border p-2 rounded"
          >
            {(SUBCATEGORY_OPTIONS[form.category] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Brand"
          className="w-full border p-2 rounded"
        />

        {/* Mini Description */}
        <textarea
          name="miniDesc"
          value={form.miniDesc}
          onChange={handleChange}
          placeholder="Mini Description (short blurb)"
          className="w-full border p-2 rounded"
          rows={2}
        />

        {/* Tags, How to Wear, Benefits, Best Day */}
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma-separated)"
          className="w-full border p-2 rounded"
        />
        <input
          name="howToWear"
          value={form.howToWear}
          onChange={handleChange}
          placeholder="How to Wear (comma-separated)"
          className="w-full border p-2 rounded"
        />
        <input
          name="benefits"
          value={form.benefits}
          onChange={handleChange}
          placeholder="Benefits (comma-separated)"
          className="w-full border p-2 rounded"
        />
        <input
          name="bestDayToWear"
          value={form.bestDayToWear}
          onChange={handleChange}
          placeholder="Best Day to Wear (comma-separated)"
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
          className={`w-full py-2 rounded text-white ${loading
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

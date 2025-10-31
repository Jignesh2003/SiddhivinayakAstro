import { useState, useEffect } from "react";
import axios from "axios";
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
  "Customized",
];

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

export default function ManageProducts() {
  const token = useAuthStore((s) => s.token);

  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: CATEGORY_OPTIONS[0],
    subcategory: "",
    brand: "",
    sizeType: SIZE_TYPE_OPTIONS[0],
    description: "",
    miniDesc: "",
    tags: "",
    howToWear: "",
    benefits: "",
    bestDayToWear: "",
    hasVariants: false, // NEW
  });
  const [stockRows, setStockRows] = useState([]);
  const [variantRows, setVariantRows] = useState([]); // NEW
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/products`
      );
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }

  function startEdit(prod) {
    setEditingId(prod._id);
    setForm({
      name: prod.name,
      price: prod.price?.toString() || "",
      category: prod.category,
      subcategory: prod.subcategory || "",
      brand: prod.brand || "",
      sizeType: prod.sizeType || "Quantity",
      description: prod.description,
      miniDesc: prod.miniDesc || "",
      tags: (prod.tags || []).join(","),
      howToWear: (prod.howToWear || []).join(","),
      benefits: (prod.benefits || []).join(","),
      bestDayToWear: (prod.bestDayToWear || []).join(","),
      hasVariants: prod.hasVariants || false, // NEW
    });

    // NEW: Load variants or stock based on product type
    if (prod.hasVariants && prod.variants?.length > 0) {
      setVariantRows(
        prod.variants.map((v) => ({
          id: v._id || Date.now(),
          variantName: v.variantName,
          gram: v.gram || "",
          price: v.price,
          stock: v.stock,
          sku: v.sku || "",
          isDefault: v.isDefault || false,
        }))
      );
      setStockRows([]);
    } else {
      setStockRows(
        prod.stock?.length
          ? prod.stock.map((s) => ({
            id: s._id || Date.now(),
            size: s.size,
            quantity: s.quantity,
          }))
          : [{ id: Date.now(), size: "", quantity: 0 }]
      );
      setVariantRows([]);
    }

    setNewFiles([]);
    setPreviews(prod.image || []);
  }

  function handleFieldChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));

    if (name === "sizeType") {
      setStockRows([{ id: Date.now(), size: "", quantity: 0 }]);
    }

    // NEW: Clear rows when toggling hasVariants
    if (name === "hasVariants") {
      if (checked) {
        setVariantRows([
          { id: Date.now(), variantName: "", gram: "", price: "", stock: "", sku: "", isDefault: true }
        ]);
        setStockRows([]);
      } else {
        setStockRows([{ id: Date.now(), size: "", quantity: 0 }]);
        setVariantRows([]);
      }
    }
  }

  // EXISTING: Stock handlers
  function handleStockChange(rowId, field, val) {
    setStockRows((rows) =>
      rows.map((r) =>
        r.id === rowId
          ? { ...r, [field]: field === "quantity" ? Number(val) : val }
          : r
      )
    );
  }

  function addStockRow() {
    setStockRows((rows) => [
      ...rows,
      { id: Date.now(), size: "", quantity: 0 },
    ]);
  }

  function removeStockRow(rowId) {
    setStockRows((rows) =>
      rows.length > 1 ? rows.filter((r) => r.id !== rowId) : rows
    );
  }

  // NEW: Variant handlers
  function handleVariantChange(rowId, field, val) {
    setVariantRows((rows) =>
      rows.map((r) => {
        if (r.id === rowId) {
          // If setting isDefault, unset others
          if (field === "isDefault" && val) {
            rows.forEach(row => {
              if (row.id !== rowId) row.isDefault = false;
            });
          }
          return {
            ...r,
            [field]: ["price", "stock", "gram"].includes(field) ? Number(val) || val : val
          };
        }
        return r;
      })
    );
  }

  function addVariantRow() {
    setVariantRows((rows) => [
      ...rows,
      { id: Date.now(), variantName: "", gram: "", price: "", stock: "", sku: "", isDefault: false },
    ]);
  }

  function removeVariantRow(rowId) {
    setVariantRows((rows) =>
      rows.length > 1 ? rows.filter((r) => r.id !== rowId) : rows
    );
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files).slice(0, 5);
    setNewFiles(files);
    Promise.all(
      files.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result);
            r.readAsDataURL(f);
          })
      )
    ).then(setPreviews);
  }

  async function saveProduct(id) {
    const fd = new FormData();

    // Append basic fields
    for (let [k, v] of Object.entries(form)) {
      if (["tags", "howToWear", "benefits", "bestDayToWear"].includes(k)) {
        fd.append(
          k,
          JSON.stringify(
            v.split(",").map((t) => t.trim()).filter(Boolean)
          )
        );
      } else if (k === "hasVariants") {
        fd.append(k, v);
      } else if (k !== "price" && k !== "sizeType") {
        // Don't append price/sizeType if using variants
        fd.append(k, v);
      }
    }

    // NEW: Conditional stock/variant handling
    if (form.hasVariants) {
      // Validate variants
      for (let v of variantRows) {
        if (!v.variantName || !v.price || !v.stock) {
          alert("❌ Please fill variant name, price, and stock for all variants.");
          return;
        }
      }

      const variants = variantRows.map((v) => ({
        variantName: v.variantName,
        gram: v.gram ? Number(v.gram) : undefined,
        price: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku || undefined,
        isDefault: v.isDefault,
      }));
      fd.append("variants", JSON.stringify(variants));
    } else {
      // Validate legacy stock
      let cleaned = stockRows
        .filter((r) => form.sizeType === "Quantity" || r.size.trim() !== "")
        .map((r) => ({ size: r.size, quantity: Number(r.quantity) }));

      for (let { size, quantity } of cleaned) {
        if (form.sizeType !== "Quantity" && !size) {
          alert("❌ Please select a size for every row.");
          return;
        }
        if (!quantity) {
          alert("❌ Please specify quantity for every row.");
          return;
        }
      }

      fd.append("price", form.price);
      fd.append("sizeType", form.sizeType);
      fd.append("stock", JSON.stringify(cleaned));
    }

    newFiles.forEach((f) => fd.append("image", f));

    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/products/${id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update product");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete");
    }
  }

  return (
    <div className="p-6 overflow-x-auto">
      <h2 className="text-2xl mb-4">Manage Products</h2>
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">#</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Price/Variants</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Stock/Variants</th>
            <th className="border p-2">Images</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={prod._id} className="border-b align-top">
              <td className="border p-1">{idx + 1}</td>

              {editingId === prod._id ? (
                <>
                  {/* NAME */}
                  <td className="border p-1">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Product Name"
                    />
                    <input
                      name="category"
                      value={form.category}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Category"
                    />
                    <input
                      name="subcategory"
                      value={form.subcategory}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Subcategory"
                    />
                    <input
                      name="brand"
                      value={form.brand}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Brand"
                    />
                    <textarea
                      name="description"
                      rows={2}
                      value={form.description}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Description"
                    />
                    <textarea
                      name="miniDesc"
                      rows={1}
                      value={form.miniDesc}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Mini Description"
                    />
                    <input
                      name="tags"
                      value={form.tags}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Tags (comma-separated)"
                    />
                    <input
                      name="howToWear"
                      value={form.howToWear}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="How To Wear"
                    />
                    <input
                      name="benefits"
                      value={form.benefits}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Benefits"
                    />
                    <input
                      name="bestDayToWear"
                      value={form.bestDayToWear}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                      placeholder="Best Day To Wear"
                    />
                  </td>

                  {/* TYPE TOGGLE */}
                  <td className="border p-1">
                    <label className="flex items-center gap-1 mb-2 p-2 bg-yellow-50 rounded">
                      <input
                        type="checkbox"
                        name="hasVariants"
                        checked={form.hasVariants}
                        onChange={handleFieldChange}
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium">Has Variants</span>
                    </label>
                  </td>

                  {/* PRICE OR VARIANTS */}
                  <td className="border p-1">
                    {!form.hasVariants && (
                      <>
                        <input
                          name="price"
                          type="number"
                          value={form.price}
                          onChange={handleFieldChange}
                          className="w-full border p-1 mb-1"
                          placeholder="Price"
                        />
                        <select
                          name="sizeType"
                          value={form.sizeType}
                          onChange={handleFieldChange}
                          className="w-full border p-1"
                        >
                          {SIZE_TYPE_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </td>

                  {/* CATEGORY */}
                  <td className="border p-1">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    >
                      {CATEGORY_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* STOCK OR VARIANTS */}
                  <td className="border p-1">
                    {form.hasVariants ? (
                      // VARIANT ROWS
                      <div className="space-y-2">
                        {variantRows.map((v) => (
                          <div key={v.id} className="p-2 bg-gray-50 rounded border space-y-1">
                            <input
                              type="text"
                              placeholder="Variant Name"
                              value={v.variantName}
                              onChange={(e) =>
                                handleVariantChange(v.id, "variantName", e.target.value)
                              }
                              className="w-full border p-1 text-xs"
                            />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Gram"
                              value={v.gram}
                              onChange={(e) =>
                                handleVariantChange(v.id, "gram", e.target.value)
                              }
                              className="w-full border p-1 text-xs"
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) =>
                                handleVariantChange(v.id, "price", e.target.value)
                              }
                              className="w-full border p-1 text-xs"
                            />
                            <input
                              type="number"
                              placeholder="Stock"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantChange(v.id, "stock", e.target.value)
                              }
                              className="w-full border p-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="SKU"
                              value={v.sku}
                              onChange={(e) =>
                                handleVariantChange(v.id, "sku", e.target.value)
                              }
                              className="w-full border p-1 text-xs"
                            />
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={v.isDefault}
                                onChange={(e) =>
                                  handleVariantChange(v.id, "isDefault", e.target.checked)
                                }
                                className="w-3 h-3"
                              />
                              Default
                            </label>
                            {variantRows.length > 1 && (
                              <button
                                onClick={() => removeVariantRow(v.id)}
                                className="text-red-500 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addVariantRow}
                          className="text-xs text-blue-600"
                        >
                          + Add Variant
                        </button>
                      </div>
                    ) : (
                      // STOCK ROWS
                      <div>
                        {stockRows.map((r) => (
                          <div key={r.id} className="flex gap-1 mb-1">
                            {form.sizeType !== "Quantity" && (
                              <select
                                value={r.size}
                                onChange={(e) =>
                                  handleStockChange(r.id, "size", e.target.value)
                                }
                                className="border p-1 text-xs"
                              >
                                <option value="">Size</option>
                                {SIZE_OPTIONS[form.sizeType].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              type="number"
                              value={r.quantity}
                              onChange={(e) =>
                                handleStockChange(r.id, "quantity", e.target.value)
                              }
                              className="w-16 border p-1 text-xs"
                              placeholder="Qty"
                            />
                            {stockRows.length > 1 && (
                              <button
                                onClick={() => removeStockRow(r.id)}
                                className="text-red-500 text-xs"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addStockRow}
                          className="text-xs text-blue-600"
                        >
                          + Add Row
                        </button>
                      </div>
                    )}
                  </td>

                  {/* IMAGES */}
                  <td className="border p-1">
                    <input
                      type="file"
                      name="image"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="border p-1 mb-1 text-xs"
                    />
                    <div className="flex flex-wrap gap-1">
                      {previews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          className="h-12 object-contain border"
                        />
                      ))}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="border p-1 space-y-1">
                    <button
                      onClick={() => saveProduct(prod._id)}
                      className="text-green-600 block text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 block text-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  {/* VIEW MODE */}
                  <td className="border p-1">
                    <strong>{prod.name}</strong>
                    <p className="text-xs text-gray-600">{prod.category}</p>
                  </td>
                  <td className="border p-1">
                    {prod.hasVariants ? (
                      <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                        Variants
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="border p-1">
                    {prod.hasVariants ? (
                      <div className="text-xs space-y-1">
                        {(prod.variants || []).map((v, i) => (
                          <div key={i} className="p-1 bg-gray-50 rounded">
                            <strong>{v.variantName}</strong>: ₹{v.price}
                            {v.isDefault && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm">₹{prod.price}</span>
                    )}
                  </td>
                  <td className="border p-1 text-xs">{prod.category}</td>
                  <td className="border p-1">
                    {prod.hasVariants ? (
                      <div className="text-xs space-y-1">
                        {(prod.variants || []).map((v, i) => (
                          <div key={i}>
                            {v.variantName}: {v.stock}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs">
                        {(prod.stock || []).map((s, i) => (
                          <div key={i}>
                            {s.size || "Qty"}×{s.quantity}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border p-1 flex gap-1 flex-wrap">
                    {(prod.image || []).slice(0, 2).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        className="h-12 object-contain border rounded"
                      />
                    ))}
                  </td>
                  <td className="border p-1 space-y-1">
                    <button
                      onClick={() => startEdit(prod)}
                      className="text-blue-600 block text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(prod._id)}
                      className="text-red-600 block text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

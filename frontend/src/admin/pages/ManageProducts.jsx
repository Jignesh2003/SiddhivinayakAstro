import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const CATEGORY_OPTIONS = [
  "Gifts","Gemstones","Necklaces","Rings",
  "Braclets","Puja samagri","Turtle",
  "Rudraksha","Customized",
];
const SIZE_TYPE_OPTIONS = ["Ring","Quantity","Mukhi","Gemstone"];
const SIZE_OPTIONS = {
  Ring: ["3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13"],
  Quantity: [],
  Mukhi: ["1 Mukhi","2 Mukhi","3 Mukhi","4 Mukhi","5 Mukhi","6 Mukhi","7 Mukhi","8 Mukhi","9 Mukhi","10 Mukhi","11 Mukhi","12 Mukhi","13 Mukhi","14 Mukhi"],
  Gemstone: ["Amethyst","Rose Quartz","Citrine","Emerald","Ruby","Sapphire","Garnet","Turquoise","Topaz","Peridot"],
};

export default function ManageProducts() {
  const token = useAuthStore(s => s.token);

  const [products, setProducts]   = useState([]);
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
    tags: "",           // comma-separated
  });
  const [stockRows, setStockRows] = useState([]);
  const [newFiles, setNewFiles]   = useState([]);
  const [previews, setPreviews]   = useState([]);

  useEffect(() => { fetchProducts(); }, []);
  async function fetchProducts() {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/products`);
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }

  function startEdit(prod) {
    setEditingId(prod._id);
    setForm({
      name:        prod.name,
      price:       prod.price.toString(),
      category:    prod.category,
      subcategory: prod.subcategory || "",
      brand:       prod.brand || "",
      sizeType:    prod.sizeType,
      description: prod.description,
      miniDesc:    prod.miniDesc || "",
      tags:        (prod.tags || []).join(","),
    });
    setStockRows(
      prod.stock.length
        ? prod.stock.map(s => ({ id: s._id, size: s.size, quantity: s.quantity }))
        : [{ id: Date.now(), size: "", quantity: 0 }]
    );
    setNewFiles([]);
    setPreviews(prod.image || []);
  }

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === "sizeType") {
      setStockRows([{ id: Date.now(), size: "", quantity: 0 }]);
    }
  }

  function handleStockChange(rowId, field, val) {
    setStockRows(rows =>
      rows.map(r =>
        r.id === rowId
          ? { ...r, [field]: field === "quantity" ? Number(val) : val }
          : r
      )
    );
  }

  function addStockRow() {
    setStockRows(rows => [...rows, { id: Date.now(), size: "", quantity: 0 }]);
  }

  function removeStockRow(rowId) {
    setStockRows(rows => rows.length > 1 ? rows.filter(r => r.id !== rowId) : rows);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files).slice(0,5);
    setNewFiles(files);
    Promise.all(files.map(f =>
      new Promise(res => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.readAsDataURL(f);
      })
    )).then(setPreviews);
  }

  async function saveProduct(id) {
    // ■■ CLEAN & VALIDATE stockRows ■■
    let cleaned = stockRows
      .filter(r => form.sizeType==="Quantity" || r.size.trim() !== "")
      .map(r => ({ size: r.size, quantity: Number(r.quantity) }));
    for (let { size, quantity } of cleaned) {
      if (form.sizeType !== "Quantity" && !size) {
        return alert("❌ Please select a size for every row.");
      }
      if (!quantity) {
        return alert("❌ Please specify quantity for every row.");
      }
    }

    const fd = new FormData();
    // append text fields
    for (let [k,v] of Object.entries(form)) {
      if (k === "tags") {
        fd.append(k, JSON.stringify(v.split(",").map(t => t.trim()).filter(Boolean)));
      } else {
        fd.append(k, v);
      }
    }
    fd.append("stock", JSON.stringify(cleaned));
    newFiles.forEach(f => fd.append("image", f));

    try {
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/products/${id}`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
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
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete");
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Manage Products</h2>
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">#</th>
            <th className="border p-2">Name & Price</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Subcategory</th>
            <th className="border p-2">Brand</th>
            <th className="border p-2">SizeType</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Mini Desc</th>
            <th className="border p-2">Tags</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Images</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, idx) => (
            <tr key={prod._id} className="border-b align-top">
              <td className="border p-1">{idx+1}</td>

              {editingId === prod._id ? (
                <>
                  <td className="border p-1">
                    <input
                      name="name" value={form.name}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                    />
                    <input
                      name="price" type="number" value={form.price}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <select
                      name="category" value={form.category}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    >
                      {CATEGORY_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-1">
                    <input
                      name="subcategory" value={form.subcategory}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="brand" value={form.brand}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <select
                      name="sizeType" value={form.sizeType}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    >
                      {SIZE_TYPE_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border p-1">
                    {stockRows.map(r => (
                      <div key={r.id} className="flex gap-1 mb-1">
                        {form.sizeType !== "Quantity" && (
                          <select
                            value={r.size}
                            onChange={e => handleStockChange(r.id, "size", e.target.value)}
                            className="border p-1"
                          >
                            <option value="">Size</option>
                            {SIZE_OPTIONS[form.sizeType].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        <input
                          type="number" value={r.quantity}
                          onChange={e => handleStockChange(r.id, "quantity", e.target.value)}
                          className="w-16 border p-1"
                        />
                        {stockRows.length > 1 && (
                          <button
                            onClick={() => removeStockRow(r.id)}
                            className="text-red-500">&times;</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addStockRow}
                      className="text-xs text-blue-600">+ Add row</button>
                  </td>
                  <td className="border p-1">
                    <textarea
                      name="miniDesc" rows={2}
                      value={form.miniDesc}
                      onChange={handleFieldChange}
                      className="w-full border p-1 mb-1"
                      placeholder="Short description"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="tags" value={form.tags}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                      placeholder="comma-separated tags"
                    />
                  </td>
                  <td className="border p-1">
                    <textarea
                      name="description" rows={2}
                      value={form.description}
                      onChange={handleFieldChange}
                      className="w-full border p-1"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      type="file" name="image"
                      multiple accept="image/*"
                      onChange={handleFileSelect}
                      className="border p-1 mb-1"
                    />
                    <div className="flex flex-wrap gap-1">
                      {previews.map((src,i) => (
                        <img key={i} src={src}
                          className="h-16 object-contain border" />
                      ))}
                    </div>
                  </td>
                  <td className="border p-1 space-y-1">
                    <button
                      onClick={() => saveProduct(prod._id)}
                      className="text-green-600">Save</button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 block">Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border p-1">
                    <strong>{prod.name}</strong><br/>
                    <small>₹{prod.price}</small>
                  </td>
                  <td className="border p-1">{prod.category}</td>
                  <td className="border p-1">{prod.subcategory}</td>
                  <td className="border p-1">{prod.brand}</td>
                  <td className="border p-1">{prod.sizeType}</td>
                  <td className="border p-1">
                    {prod.stock.map(s => (
                      <div key={s._id||s.size}>
                        {s.size||"Qty"}×{s.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="border p-1">{prod.miniDesc}</td>
                  <td className="border p-1">{(prod.tags||[]).join(", ")}</td>
                  <td className="border p-1">{prod.description}</td>
                  <td className="border p-1 flex gap-1 flex-wrap">
                    {prod.image.map((url,i) => ( 
                      <img key={i} src={url}
                        className="h-16 object-contain border" />
                    ))}
                  </td>
                  <td className="border p-1 space-y-1">
                    <button
                      onClick={() => startEdit(prod)}
                      className="text-blue-600">Edit</button>
                    <button
                      onClick={() => deleteProduct(prod._id)}
                      className="text-red-600 block">Delete</button>
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

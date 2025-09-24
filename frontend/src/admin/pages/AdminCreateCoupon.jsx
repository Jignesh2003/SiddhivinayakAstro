import  { useState } from "react";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const initialState = {
    code: "",
    description: "",
    type: "general", // general, new_user, product_specific, category_specific, cart_value
    discountType: "flat",
    discountValue: "",
    currency: "INR",
    minCartValue: 0,
    maxCartValue: "",
    maxDiscount: "",
    startDate: new Date().toISOString().substring(0, 10),
    endDate: "",
    isActive: true,
    usageLimit: "",
    perUserLimit: "",
    newUsersOnly: false,
    combinable: false,
    applicableProducts: [],
    excludedProducts: [],
    applicableCategories: [],
    restrictedToUsers: [],
    metadata: "",
};

export default function AdminCreateCoupon() {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { token } = useAuthStore.getState();

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "applicableProducts" ||
                        name === "excludedProducts" ||
                        name === "applicableCategories" ||
                        name === "restrictedToUsers"
                        ? value.split(",").map((v) => v.trim())
                        : value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minCartValue: Number(form.minCartValue),
                maxCartValue: form.maxCartValue ? Number(form.maxCartValue) : null,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
                startDate: form.startDate || new Date().toISOString(),
                endDate: form.endDate || null,
                // ensure array fields are empty array if not provided
                applicableProducts: form.applicableProducts || [],
                excludedProducts: form.excludedProducts || [],
                applicableCategories: form.applicableCategories || [],
                restrictedToUsers: form.restrictedToUsers || [],
                metadata: form.metadata ? JSON.parse(form.metadata) : {},
            };

            const res = await axios.post(
                `${import.meta.env.VITE_COUPON_URL}/create`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setSuccess("Coupon created successfully!");
                setForm(initialState);
            } else {
                setError(res.data.message || "Failed to create coupon");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || err.message || "Error creating coupon"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto p-10 mt-30 bg-white rounded-md shadow-md space-y-6"
        >
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Create New Coupon
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupon Code */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Code<span className="text-red-500">*</span>:
                    </label>
                    <input
                        type="text"
                        name="code"
                        value={form.code}
                        maxLength={20}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300 uppercase"
                    />
                </div>

                {/* Coupon Type */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Type:
                    </label>
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    >
                        <option value="general">General</option>
                        <option value="new_user">New Users Only</option>
                        <option value="product_specific">Specific Products</option>
                        <option value="category_specific">Specific Categories</option>
                        <option value="cart_value">Cart Value Based</option>
                    </select>
                </div>

                {/* Discount Type */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Discount Type<span className="text-red-500">*</span>:
                    </label>
                    <select
                        name="discountType"
                        value={form.discountType}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    >
                        <option value="flat">Flat (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                    </select>
                </div>

                {/* Discount Value */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Discount Value<span className="text-red-500">*</span>:
                    </label>
                    <input
                        type="number"
                        name="discountValue"
                        value={form.discountValue}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Currency */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Currency:
                    </label>
                    <input
                        type="text"
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300 uppercase"
                    />
                </div>

                {/* Min / Max Cart Value */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Minimum Cart Value:
                    </label>
                    <input
                        type="number"
                        name="minCartValue"
                        value={form.minCartValue}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Maximum Cart Value (optional):
                    </label>
                    <input
                        type="number"
                        name="maxCartValue"
                        value={form.maxCartValue}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Maximum Discount */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Maximum Discount (optional):
                    </label>
                    <input
                        type="number"
                        name="maxDiscount"
                        value={form.maxDiscount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Start / End Date */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Start Date:
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        End Date:
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Is Active */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        id="isActive"
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isActive" className="font-medium text-gray-700">
                        Is Active
                    </label>
                </div>

                {/* Usage Limits */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Usage Limit (global, optional):
                    </label>
                    <input
                        type="number"
                        name="usageLimit"
                        value={form.usageLimit}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Per User Limit:
                    </label>
                    <input
                        type="number"
                        name="perUserLimit"
                        value={form.perUserLimit}
                        onChange={handleChange}
                        placeholder="Leave empty for unlimited"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />

                </div>

                {/* New Users Only */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="newUsersOnly"
                        checked={form.newUsersOnly}
                        onChange={handleChange}
                        id="newUsersOnly"
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="newUsersOnly" className="font-medium text-gray-700">
                        New Users Only
                    </label>
                </div>

                {/* Combinable */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="combinable"
                        checked={form.combinable}
                        onChange={handleChange}
                        id="combinable"
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="combinable" className="font-medium text-gray-700">
                        Combinable with Other Coupons
                    </label>
                </div>

                {/* Applicable / Excluded Products */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Applicable Products (comma separated IDs):
                    </label>
                    <input
                        type="text"
                        name="applicableProducts"
                        value={form.applicableProducts.join(", ")}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Excluded Products (comma separated IDs):
                    </label>
                    <input
                        type="text"
                        name="excludedProducts"
                        value={form.excludedProducts.join(", ")}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Applicable Categories */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Applicable Categories (comma separated IDs):
                    </label>
                    <input
                        type="text"
                        name="applicableCategories"
                        value={form.applicableCategories.join(", ")}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>

                {/* Restricted Users */}
                <div>
                    <label className="block mb-2 font-medium text-gray-700">
                        Restricted Users (comma separated IDs):
                    </label>
                    <input
                        type="text"
                        name="restrictedToUsers"
                        value={form.restrictedToUsers.join(", ")}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
                    />
                </div>
            </div>

            {/* Metadata */}
            <label className="block mt-4 mb-2 font-medium text-gray-700">
                Metadata (JSON format):
            </label>
            <textarea
                name="metadata"
                value={form.metadata}
                onChange={handleChange}
                rows={3}
                placeholder='{"key": "value"}'
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
            />

            {/* Description */}
            <label className="block mt-4 mb-2 font-medium text-gray-700">
                Description:
            </label>
            <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
            />

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md shadow-md transition"
            >
                {loading ? "Creating..." : "Create Coupon"}
            </button>

            {error && <p className="mt-4 text-center text-red-600">{error}</p>}
            {success && <p className="mt-4 text-center text-green-600">{success}</p>}
        </form>
    );
}

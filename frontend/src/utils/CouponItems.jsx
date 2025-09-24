import  { useEffect } from "react";
import useCouponStore from "../store/useCouponStore";
import { Tag, CheckCircle } from "lucide-react"; // Icons
import useCartStore from "@/store/useCartStore";

export default function CouponItems() {
    const { coupons, appliedCoupon, loading, error, fetchCoupons, applyCoupon } =
        useCouponStore();
    const cart = useCartStore((state) => state.cart); // ✅ correct store
    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons,cart]);

    if (loading) return <p className="text-center text-gray-500">Loading coupons...</p>;
    if (error) return <p className="text-center text-red-600">{error}</p>;

    return (
        <div className="relative max-w-full">
            {/* Scrollable row */}
            <div className="flex overflow-x-auto space-x-6 py-6 px-8 scroll-smooth">
                {coupons.map((coupon) => {
                    const isApplied = appliedCoupon?._id === coupon._id;
                    return (
                        <div
                            key={coupon._id}
                            className={`relative inline-block min-w-[260px] max-w-[300px] rounded-2xl shadow-lg 
              bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border 
              hover:shadow-2xl transition-all duration-300`}
                        >
                            {/* Top Banner */}
                            <div className="bg-gradient-to-r from-yellow-600 to-yellow-200 text-white px-4 py-2 rounded-t-2xl flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-5 h-5" />
                                    <h3 className="text-lg font-bold tracking-wide">{coupon.code}</h3>
                                </div>
                                {isApplied && <CheckCircle className="w-6 h-6 text-green-300" />}
                            </div>

                            {/* Body */}
                            <div className="p-4 flex flex-col space-y-3">
                                <p className="text-gray-700 text-sm break-words whitespace-normal">
                                    {coupon.description || "No description provided"}
                                </p>

                                <div className="flex flex-col text-sm">
                                    <span className="font-semibold text-gray-900">
                                        {coupon.discountType === "flat"
                                            ? `Flat ₹${coupon.discountValue}`
                                            : `${coupon.discountValue}% Off`}
                                    </span>
                                    {coupon.maxDiscount && (
                                        <span className="text-gray-600 text-xs">
                                            (Max discount ₹{coupon.maxDiscount})
                                        </span>
                                    )}
                                    {coupon.minCartValue > 0 && (
                                        <span className="text-gray-600 text-xs">
                                            Min Cart Value: ₹{coupon.minCartValue.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => applyCoupon(coupon)}
                                    disabled={isApplied}
                                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 
                    ${isApplied
                                            ? "bg-gray-300 cursor-not-allowed text-gray-700"
                                            : "bg-gradient-to-r from-yellow-600 to-yellow-200 hover:bg-indigo-700 text-white shadow-md hover:shadow-xl"
                                        }`}
                                >
                                    {isApplied ? "Applied" : "Apply Coupon"}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {coupons.length === 0 && (
                    <p className="text-gray-500 italic">No coupons available right now.</p>
                )}
            </div>
        </div>
    );
}

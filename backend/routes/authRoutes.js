import express from "express";
import {
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
  checkingAuth,
  sendOtp,
  verifyOtp,
  addReviewProduct,
  deleteReview,
  getPendingKycAstrologers,
  verifyAstrologerKyc,
  addProduct,
  // bulkUpdateAstrology,
  // getDailyAstrology,
} from "../controllers/authController.js";
import {placeOrder,getUserOrders,  getAllOrders,  getSingleOrder,  updateOrderStatus, checkCodOrderStatus,
} from "../controllers/orderController.js";
import {getProducts,  getSingleProductDetail,  editAdminProduct,  deleteAdminProduct,  markAsPaid,
} from "../controllers/productController.js";
import {  addToCart,  getCart,  removeFromCart,  updateCart,  clearCart,
} from "../controllers/cartController.js";
import {  getWishlist,  addToWishlist,  removeFromWishlist,
} from "../controllers/wishlistController.js";
import otpLimiter from "../utils/otpLimiter.js";
import  { uploadMultipleImages } from "../middlewares/multer.js";
import authMiddleware from "../middlewares/authMiddleware.js"

const router = express.Router();

//signup Route here
router.post("/signup", otpLimiter, signupUser);

//login Route here
router.post("/login", loginUser);

//otp route here
router.post("/forgot-password", otpLimiter, forgotPassword); // 🔥 Forgot Password Route

router.post("/reset-password/:token", resetPassword); // 🔥 Reset Password Route

router.get("/checking-auth", authMiddleware, checkingAuth);

router.get("/products", getProducts);

router.get("/products/:id",getSingleProductDetail)

router.post("/add-cart", authMiddleware, addToCart);

router.get("/cart/:userId", authMiddleware, getCart);

router.delete("/remove/:productId", authMiddleware, removeFromCart);

router.put("/update", authMiddleware, updateCart);

router.delete("/clear-cart/:userId",authMiddleware,clearCart)

router.post("/place-order", authMiddleware, placeOrder)

router.get("/check-status", checkCodOrderStatus); // /api/orders/check-status

router.get("/user-orders", authMiddleware, getUserOrders);

router.post("/otp-sent",authMiddleware,sendOtp)

router.post('/verify-otp',authMiddleware,verifyOtp)

router.get("/order/:id", authMiddleware , getSingleOrder)

router.get("/get-wishlist", authMiddleware, getWishlist);

router.post("/add-wishlist", authMiddleware, addToWishlist);

router.delete("/remove-wishlist", authMiddleware, removeFromWishlist);

//add reviews and rating 
router.post("/products/:id/reviews", authMiddleware, addReviewProduct)

//delete my review
router.delete("/:productId/reviews/:reviewId", authMiddleware, deleteReview);

//admin
router.get("/admin/all-orders", authMiddleware, getAllOrders);

//admin
router.put("/admin/update-status", authMiddleware, updateOrderStatus);

//admin
// ✅ Create Product with Image Upload
router.post(
  "/add-product",uploadMultipleImages, addProduct
);

// edit admin page
router.put("/products/:id",uploadMultipleImages, editAdminProduct);

//delete product from admin
router.delete("/products/:id", authMiddleware, deleteAdminProduct);

router.put("/admin/orders/:orderId", authMiddleware, markAsPaid)

//admin get req of astro kyc with pending
router.get("/admin/astrologers/pending-kyc", authMiddleware,  getPendingKycAstrologers);

// ─── 2) Approve or reject a single astrologer’s KYC ──────────────────
router.patch("/admin/astrologers/:id/verify",authMiddleware,verifyAstrologerKyc);
    




export default router;

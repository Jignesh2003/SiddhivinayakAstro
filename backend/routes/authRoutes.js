import express from "express";
import {
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
  checkingAuth,
  addReviewProduct,
  deleteReview,
  getPendingKycAstrologers,
  verifyAstrologerKyc,
  addProduct,
  acceptTmc,
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
import passport from "passport";
import jwt from "jsonwebtoken"

const router = express.Router();

function sendToken(req, res) {
  const user = req.user;
  console.log("sendToken called for user:", req.user);
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      isVerified: user.isVerified || false,
      agreedToTerms: user.agreedToTerms || false,
      name: user.firstName || "",
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  console.log("token:", token);

  // ✅ redirect with token in query
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
}

//signup Route here
router.post("/signup", otpLimiter, signupUser);

//login Route here
router.post("/login", loginUser);

// Google login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    console.log("Callback hit:", { err, user, info });

    if (err) {
      console.error("Passport error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      console.error("No user returned:", info);
      return res.redirect(`${process.env.CLIENT_URL}/login`);
    }

    // Attach user and send JWT
    req.user = user;
    sendToken(req, res);
  })(req, res, next);
});

router.post("/accept-terms", authMiddleware, acceptTmc);

//otp route here
router.post("/forgot-password", otpLimiter, forgotPassword); //  Forgot Password Route

router.post("/reset-password/:token", resetPassword); //  Reset Password Route

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

router.get("/order/:id", authMiddleware , getSingleOrder)

router.get("/get-wishlist", authMiddleware, getWishlist);

router.post("/add-wishlist", authMiddleware, addToWishlist);

router.delete("/remove-wishlist", authMiddleware, removeFromWishlist);

//add reviews and rating 
router.post("/products/:productId/reviews", authMiddleware, addReviewProduct);

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

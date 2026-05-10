import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js"; // Renamed for clarity
import crypto from "crypto";
import Product from "../models/Product.js";
import { signupValidation, loginSchema } from "../validation/userValidation.js";
import PostgresDb from '../config/postgresDb.js'

//  Signup Controller
export const signupUser = async (req, res) => {
  try {
    // 1. Validate input
    const { error, value } = signupValidation.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // 2. Destructure ONLY the fields we're actually sending
    let {
      email,
      firstName,
      lastName,
      password,
      agreedToTerms,
      phone
    } = value;

    // Normalize email to lowercase
    email = email.trim().toLowerCase();

    // 3. Check for duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists! Please log in." });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create Mongo user with ONLY the fields we have
    const newUser = new User({
      firstName,
      lastName: lastName || "", // Empty string if not provided
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      agreeToTmc: agreedToTerms,
      // phone, address, pincode, city, state, country removed
    });

    await newUser.save();

    // 6. Create wallet in Postgres via Knex
    try {
      await PostgresDb('wallet').insert({
        user_id: newUser._id.toString(),
        balance: 0.00,
        currency: 'INR',
        status: 'active',
      });
    } catch (walletErr) {
      console.warn("⚠️ Wallet creation skipped:", walletErr.message);
    }

    // 7. All OK - user created successfully in MongoDB
    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Login Controller
export const loginUser = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res
        .status(400)
        .json({ message: error.details.map((err) => err.message).join(", ") });
    }

    let { email, password } = value;

    //👇 Normalize email for case-insensitive authentication
    if (email && email.includes('@')) {
      email = email.trim().toLowerCase();
    } else if (email) {
      email = email.trim();  // if phone, just trim
    }

    // ✅ Check if user exists (by email or phone)
    const user = await User.findOne({
      $or: [
        { email: email },       // now always lowercase, matches signup standard
        { phone: email }
      ]
    });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .json({ message: "Token sent!", token, role: user.role, isVerified: user.isVerified, userId: user._id, hasUsedFreeTrial: user.hasUsedFreeTrial });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Forgot Password - Generate Reset Token & Send Email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    // ✅ Check if user exists
    console.log(email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // ✅ Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // ✅ Store Hashed Token in Database with Expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // ✅ Send Reset Email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    // const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `Click the link below to reset your password. This link is valid for 10 minutes.\n\n${resetUrl}`;

    await sendEmail(email, "Password Reset Request", message);

    res.status(200).json({ message: "Password reset email sent!", email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const rawToken = req.params.token;
    // 1) Validate only `{ password }`
    const { password } = req.body;

    // 2) Look up user by ANY account that still has a reset token
    //    (we'll compare it next with bcrypt)
    const user = await User.findOne({
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token!" });
    }

    // 3) Compare the raw URL token with the hashed token in DB
    const isMatch = await bcrypt.compare(rawToken, user.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid token!" });
    }

    // 4) Everything’s good—hash the new password and clear the reset fields
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
//checking authorization in navbar of fe
export const checkingAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ 
      message: "Authenticated", 
      role: user.role,
      isVerified: user.isVerified,
      userId: user._id,
      hasUsedFreeTrial: user.hasUsedFreeTrial
    });
  } catch (error) {
    console.error("checkingAuth error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

//Add review and rating 
export const addReviewProduct = async (req, res) => {
  try {
    //  const { error, value } = addReviewSchema.validate(req.body);
    //   if (error) return res.status(400).json({ message: error.details[0].message });
    const userId = req.user.id;
    const { productId } = req.params;
    const { text, rating, media } = req.body;

    console.log(productId);


    if (!userId || !text || !rating) {
      return res.status(400).json({ message: "User ID, text, and rating are required." });
    }
    console.log(text, rating, media);

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newReview = {
      userId,
      text,
      rating,
      media: media || null,
      createdAt: new Date(),
    };

    product.reviews.push(newReview);
    await product.save();

    res.status(201).json({ message: "Review added", review: newReview });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Error adding review", error });
  }
}

// ✅ Delete a Review
export const deleteReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user.id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find the review
    const reviewIndex = product.reviews.findIndex((review) => review._id.toString() === reviewId);

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the logged-in user is the author of the review
    if (product.reviews[reviewIndex].userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    // Remove the review
    product.reviews.splice(reviewIndex, 1);
    await product.save();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    // Validate image upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    const {
      name,
      description,
      miniDesc,
      tags,
      category,
      subcategory,
      brand,
      howToWear,
      benefits,
      bestDayToWear,
      // NEW: Variant fields
      hasVariants,
      variants: variantsRaw,
      // Legacy fields (only used if hasVariants = false)
      price,
      sizeType,
      stock: stockRaw,
    } = req.body;

    console.log("Request body:", req.body);

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        message: "name, description, and category are required.",
      });
    }

    // Helper function to parse array fields
    function parseMultiField(val) {
      if (!val) return [];
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(",").map((v) => v.trim()).filter(Boolean);
        }
      } else if (Array.isArray(val)) {
        return val;
      }
      return [];
    }

    // Parse common array fields
    const tagsArray = parseMultiField(tags);
    const howToWearArray = parseMultiField(howToWear);
    const benefitsArray = parseMultiField(benefits);
    const bestDayToWearArray = parseMultiField(bestDayToWear);

    // Handle images
    const image = req.files.map((f) => f.path);
    const imagePublicId = req.files.map((f) => f.filename);

    // Build base product data
    const productData = {
      name,
      description,
      miniDesc: miniDesc || "",
      tags: tagsArray,
      category,
      subcategory: subcategory || "",
      brand: brand || "",
      image,
      imagePublicId,
      howToWear: howToWearArray,
      benefits: benefitsArray,
      bestDayToWear: bestDayToWearArray,
      hasVariants: hasVariants === "true" || hasVariants === true,
    };

    // NEW: Conditional handling for variants vs legacy
    if (productData.hasVariants) {
      // ===== VARIANT PRODUCT =====
      let parsedVariants;
      try {
        parsedVariants = typeof variantsRaw === "string"
          ? JSON.parse(variantsRaw)
          : variantsRaw;
      } catch (err) {
        return res.status(400).json({ message: "Invalid variants JSON format." });
      }

      // Validate variants array
      if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
        return res.status(400).json({
          message: "At least one variant is required when hasVariants is true.",
        });
      }

      // Validate each variant
      for (const variant of parsedVariants) {
        if (!variant.variantName || !variant.price || variant.stock === undefined) {
          return res.status(400).json({
            message: "Each variant must have variantName, price, and stock.",
          });
        }
        if (typeof variant.price !== "number" || typeof variant.stock !== "number") {
          return res.status(400).json({
            message: "Variant price and stock must be numbers.",
          });
        }
      }

      productData.variants = parsedVariants;

      console.log("Creating variant product with variants:", parsedVariants);
    } else {
      // ===== LEGACY PRODUCT =====
      if (!price) {
        return res.status(400).json({
          message: "price is required for standard products.",
        });
      }

      let stock;
      try {
        stock = typeof stockRaw === "string" ? JSON.parse(stockRaw) : stockRaw;

        if (!Array.isArray(stock) || stock.length === 0) {
          throw new Error("Stock must be a non-empty array");
        }

        // Validate stock entries
        stock.forEach((entry) => {
          if (typeof entry.quantity !== "number") {
            throw new Error("Quantity must be numeric");
          }
          if (sizeType !== "Quantity" && !entry.size) {
            throw new Error("Size is required for non-quantity products");
          }
        });
      } catch (err) {
        return res.status(400).json({
          message: "Invalid stock format: " + err.message,
        });
      }

      productData.price = Number(price);
      productData.sizeType = sizeType || "Quantity";
      productData.stock = stock;

      console.log("Creating legacy product with price:", price, "and stock:", stock);
    }

    // Create product
    const product = await Product.create(productData);
    console.log("Product created successfully:", product._id);

    res.status(201).json({
      message: "Product added successfully!",
      product,
    });
  } catch (err) {
    console.error("Error adding product:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};


export const getPendingKycAstrologers = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1) Verify that the caller’s userId exists in the database
    const caller = await User.findById(userId).select("_id role");
    if (!caller) {
      return res.status(401).json({ message: "Invalid user token" });
    }

    // (Optional) If you need to restrict this endpoint to admin only,
    // you could also check: 
    if (caller.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2) Fetch all astrologers whose kyc status is "pending"
    const pendingAstrologers = await User.find({
      role: "astrologer",
      kyc: "pending",
    }).select("firstName lastName email phone yearsOfExperience documents kyc");

    return res.status(200).json({ astrologers: pendingAstrologers });
  } catch (error) {
    console.error("Error fetching pending KYC astrologers:", error);
    return res.status(500).json({
      message: "Server error while fetching pending KYC astrologers.",
    });
  }
};

export const verifyAstrologerKyc = async (req, res) => {
  const userId = req.user.id
  try {
    const caller = await User.findById(userId).select("_id role");
    if (!caller) {
      return res.status(401).json({ message: "Invalid user token" });
    }

    // (Optional) If you need to restrict this endpoint to admin only,
    // you could also check: 
    if (caller.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 2) Validate `status`
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 3) Find the astrologer by ID and update kyc
    const updated = await User.findOneAndUpdate(
      { _id: id, role: "astrologer" },
      { $set: { kyc: status } },
      { new: true }
    ).select("firstName lastName email phone yearsOfExperience documents kyc");

    if (!updated) {
      return res.status(404).json({ message: "Astrologer not found" });
    }

    return res
      .status(200)
      .send({ message: `KYC ${status}`, astrologer: updated });
  } catch (error) {
    console.error("Error verifying astrologer KYC:", error);
    return res
      .status(500)
      .json({ message: "Server error while verifying KYC." });
  }
};


export const acceptTmc = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.agreeToTmc = true; // ✅ correct field name from your schema
    await user.save();

    return res.json({ message: "Terms accepted", agreeToTmc: true });
  } catch (error) {
    console.error("Error in acceptTmc:", error);
    return res.status(500).json({ message: "Internal Server Error in acceptTmc!" });
  }
};

export const useFreeTrial = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.hasUsedFreeTrial = true;
    await user.save();

    return res.status(200).json({ message: "Free trial marked as used", hasUsedFreeTrial: true });
  } catch (error) {
    console.error("Error in useFreeTrial:", error);
    return res.status(500).json({ message: "Internal Server Error in useFreeTrial!" });
  }
};

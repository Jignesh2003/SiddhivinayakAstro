import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateOTP from "../utils/generateOTP.js";
import sendEmail from "../utils/sendEmail.js"; // Renamed for clarity
import crypto from "crypto";
import Product from "../models/Product.js";
import { signupValidation ,loginSchema, verifyOtpSchema} from "../validation/userValidation.js";
import PostgresDb from '../config/postgresDb.js'

// ✅ Signup Controller
export const signupUser = async (req, res) => {
  try {
    // 1. Validate input
    const { error, value } = signupValidation.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Normalize email to lowercase for consistency
    let { email, firstName, lastName, phone, address, pincode, city, state, password, country } = value;
    email = email.trim().toLowerCase(); // <---- NORMALIZE EMAIL

    // 2. Check for duplicate email (in lowercase)
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "User already exists! Please log in." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create Mongo user (store normalized email)
    const newUser = new User({
      firstName,
      lastName,
      email, // already normalized
      phone,
      address,
      pincode,
      city,
      state,
      country,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    // 5. Create wallet in Postgres/Supabase
    try {
      await PostgresDb.query(
        `INSERT INTO wallet (user_id, balance, currency, status)
         VALUES ($1, 0.00, 'INR', 'active')`,
        [newUser._id.toString()]
      );
    } catch (walletErr) {
      console.error("Wallet creation error:", walletErr.message);

      // Delete user for DB consistency if wallet creation fails
      try {
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ message: "Signup failed during wallet setup. User record rolled back." });
      } catch (deleteErr) {
        console.error("CRITICAL: User rollback failed:", deleteErr);
        return res.status(500).json({ message: "Signup failed and rollback failed! Contact support." });
      }
    }

    // 6. All OK
    res.status(201).json({ message: "Signup successful and wallet created!" });
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
      .json({ message: "Token sent!", token, role: user.role, isVerified: user.isVerified, userId: user._id });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Forgot Password - Generate Reset Token & Send Email
  export const forgotPassword = async (req, res) => {
    try {
  const {email} = req.body
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
export const checkingAuth = (req, res) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
};

//Add review and rating 
export const addReviewProduct = async (req,res)=>{
    try {

 const { error, value } = addReviewSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { userId, text, rating, media } = value;  
  if (!userId || !text || !rating) {
    return res.status(400).json({ message: "User ID, text, and rating are required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

    const product = await Product.findById(req.params.id);
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

// Create and send otp to user
export const sendOtp = async (req, res) => {
  try {
 const { error, value } = sendOtpSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { userId } = value;  
  const user = await User.findOne({_id:userId})
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }
    // Generate OTP
    const otp = generateOTP();
    
    // Set OTP expiration time (e.g., 5 minutes from now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);  // OTP expires in 5 minutes


    // Save OTP and OTP expiry in the user's document
    user.otp = otp;
    user.otpExpiry = expirationTime;
    await user.save();

    await sendEmail(user.email, 'Your OTP for Verification', `Your OTP is: ${otp}`);
    
    // Return success response
    res.status(200).json({ message: 'OTP sent successfully to your email' });
  } catch (error) {
    console.error('Error in OTP process:', error);
    res.status(500).json({ message: 'Error generating or sending OTP' });
  }
}

// Verify otp 
export const verifyOtp = async (req, res) => {
   try {
 const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { userId, otp } = value;
 
    // Find the user by email
    const user = await User.findOne({ _id:userId });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if OTP has expired
    const currentTime = new Date();
    if (user.otpExpiry < currentTime) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP is correct
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid, mark user as verified
    user.isVerified = true;
    user.otp = "";  // Clear OTP after successful verification
    user.otpExpiry = "";  // Clear OTP expiry

    // Save updated user document
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error in OTP verification:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

export const addProduct = async (req, res) => {
  try {
    // ensure files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    // basic fields
    const {
      name,
      price,
      description,
      miniDesc,        // ← new
      tags,            // ← new
      category,
      subcategory,
      brand,
      sizeType,
      stock: stockRaw
    } = req.body;

    if (!name || !price || !description || !category || !stockRaw) {
      return res.status(400).json({
        message: "name, price, description, category and stock are required."
      });
    }

    // parse & validate stock
    let stock;
    try {
      stock = JSON.parse(stockRaw);
      if (!Array.isArray(stock) || stock.length === 0) throw new Error();
      stock.forEach(entry => {
        if (typeof entry.quantity !== "number") throw new Error("Quantity must be numeric");
        if (sizeType !== "Quantity" && !entry.size) throw new Error("Size is required");
      });
    } catch {
      return res.status(400).json({ message: "Invalid stock format." });
    }

    // map files → arrays
    const image         = req.files.map(f => f.path);
    const imagePublicId = req.files.map(f => f.filename);

    // build tags array if provided as comma-string or JSON
    let tagsArray = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          // allow JSON-encoded or comma-separated
          tagsArray = JSON.parse(tags);
        } catch {
          tagsArray = tags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    const product = await Product.create({
      name,
      price,
      description,
      miniDesc: miniDesc ?? "",    // ensure it’s present
      tags:     tagsArray,
      category,
      subcategory,
      brand,
      sizeType,
      stock,
      image,
      imagePublicId
    });

    res.status(201).json({ message: "Product added!", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
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

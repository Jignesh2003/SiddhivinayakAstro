import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "admin", "seller", "astrologer"],
      default: "user",
    },

    // Basic info
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },

    // Address
    address: { type: String },
    pincode: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },

    // OTP Verification
    otp: { type: String, default: "" },
    otpExpiry: { type: Date, default: "" },
    isVerified: { type: Boolean, default: false },
    kyc: {
      type: String,
      default: "notYet",
      enum: ["pending", "rejected", "approved", "notYet"],
    },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // ⭐ Astrologer-specific fields (optional for other roles)
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    location: { type: String },
    expertise: {
      type: String,
      enum: [
        "Vedic",
        "Tarot",
        "Numerology",
        "Palmistry",
        "Horary",
        "KP",
        "Western",
        "Lal Kitab",
        "Other",
      ],
    },
    yearsOfExperience: { type: Number },
    documents: {
      aadhaar: String,
      pan: String,
      education: String,
      bank: String,
    },
    bio: { type: String },
    languagesSpoken: [{ type: String }],
    pricePerMinute: { type: Number },

    // Wallet & Session Info
    walletBalance: { type: Number, default: 0 }, // 🟢 Used to hold funds for user or astrologer
    isOnline: { type: Boolean, default: false }, // 🟢 Astrologer status
    averageRating: { type: Number, default: 0 }, // 🟢 Updated after reviews
    totalSessions: { type: Number, default: 0 }, // 🟢 Increment after each completed session
    agreeToTmc: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

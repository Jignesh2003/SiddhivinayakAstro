import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { astrologerListQuerySchema,  } from "../validation/astrologerValidation.js"
import PostgresDb from '../config/postgresDb.js'

export const astrologerSignup = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, password, gender,
      dob, location, expertise, yearsOfExperience, bio,
      languagesSpoken, pricePerMinute, role, country, city, state
    } = req.body;

    // Check if user already exists with same email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      let conflictField = "";
      if (existingUser.email === email) conflictField = "Email";
      else if (existingUser.phone === phone) conflictField = "Phone number";
      return res
        .status(400)
        .json({ message: `${conflictField} already exists` });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new astrologer
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      gender,
      dob,
      location,
      expertise,
      yearsOfExperience,
      bio,
      languagesSpoken,
      pricePerMinute,
      role,
      country, city, state,
    });

    await newUser.save();

    // 🟢 CREATE WALLET for Astrologer in PostgreSQL
    try {
      await PostgresDb.query(
        `INSERT INTO wallet (user_id, balance, currency, status)
         VALUES ($1, 0.00, 'INR', 'active')`,
        [newUser._id.toString()]
      );
      // Optionally handle duplicate (conflict) wallet, should not happen here.
    } catch (walletErr) {
      // Optionally rollback or notify admin of partial failure
      console.error("Wallet creation error (Astrologer):", walletErr.message);
      return res.status(500).json({ message: "Signup failed during wallet setup." });
    }

    res
      .status(201)
      .json({ message: "Signup successful. Please verify your account." });
  } catch (err) {
    console.error("Signup Error:", err);

    // Handle duplicate key error gracefully
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res
        .status(400)
        .json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    }

    res.status(500).json({ message: "Server error during signup" });
  }
};

export const astrologerList = async (req, res) => {
  try {
     const { error } = astrologerListQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const filter = { role: "astrologer" , kyc:"approved"};

    // Optional online filter
    if (req.query.isOnline === "true") {
      filter.isOnline = true;
    }

    // You can add more filters in the future, like:
    // if (req.query.expertise) filter.expertise = req.query.expertise;

    const astrologers = await User.find(filter);
    res.status(200).json(astrologers);
  } catch (err) {
    console.error("Error fetching astrologer list:", err);
    res.status(500).json({ message: "Server error while fetching astrologers" });
  }
};

export const uploadDocuments = async (req, res) => {

  try {
    const { aadhaar, pan, education, bank } = req.files;

    if (!aadhaar || !pan || !education || !bank) {
      return res.status(400).json({ message: "All documents are required." });
    }
console.log("FILES:", req.files);
const updatedUser = await User.findByIdAndUpdate(
  req.user.id,
  {
    $set: {
      "documents.aadhaar": aadhaar[0].path,
      "documents.pan": pan[0].path,
      "documents.education": education[0].path,
      "documents.bank": bank[0].path,
            kyc: "pending" // ✅ Set KYC status when documents are uploaded
    },
  },
  { new: true }
);


    res.status(200).json({ message: "Documents uploaded successfully", user: updatedUser });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload documents" });
  }
};

export const getAstrologerDetails = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "Astrologer not found" });
    }

    res.status(200).json({ message: "Astro data sent!", user });
  } catch (error) {
    console.error("Error fetching astrologer details:", error);
    res.status(500).json({ message: "Something went wrong!", error });
  }
};

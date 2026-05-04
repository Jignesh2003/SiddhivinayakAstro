import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { astrologerListQuerySchema,  } from "../validation/astrologerValidation.js"
import PostgresDb from '../config/postgresDb.js'
import jwt from "jsonwebtoken";

export const astrologerSignup = async (req, res) => {
  try {
    let {
      firstName, lastName, email, phone, password, gender,
      dob, location, expertise, yearsOfExperience, bio,
      languagesSpoken, pricePerMinute, role, country, city, state
    } = req.body;

    // 1. Normalize email
    email = email.trim().toLowerCase();

    // 2. Check if astrologer already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingUser) {
      let conflictField = "";
      if (existingUser.email === email) conflictField = "Email";
      else if (existingUser.phone === phone) conflictField = "Phone number";
      return res.status(400).json({ message: `${conflictField} already exists` });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create and save new astrologer in MongoDB
    const newUser = new User({
      firstName,
      lastName,
      email, // always lowercase
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

    // 5. Create wallet for astrologer in Postgres (via Knex, but named PostgresDb)
    try {
      await PostgresDb('wallet').insert({
        user_id: newUser._id.toString(),
        balance: 0.00,
        currency: 'INR',
        status: 'active'
      });
    } catch (walletErr) {
      console.warn("⚠️ Wallet creation skipped (Astrologer):", walletErr.message);
      // Continue with signup even if wallet creation fails
    }

    // 6. All OK!
    res.status(201).json({ message: "Signup successful. Please verify your account." });
  } catch (err) {
    console.error("Signup Error:", err);

    // Handle duplicate key error from Mongo _before_ save (should not happen here, but safe)
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

// ✅ Astrologer Login
export const astrologerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with email AND role is "astrologer"
    const user = await User.findOne({
      email: normalizedEmail,
      role: "astrologer"
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate login token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return token and astrologer data without password
    const astrologerData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isOnline: user.isOnline,
      expertise: user.expertise,
      yearsOfExperience: user.yearsOfExperience,
      bio: user.bio,
      languagesSpoken: user.languagesSpoken,
      pricePerMinute: user.pricePerMinute,
      averageRating: user.averageRating,
      totalSessions: user.totalSessions,
    };

    res.status(200).json({
      message: "Login successful!",
      token,
      astrologer: astrologerData,
      role: user.role,
      isVerified: user.isVerified,
      userId: user._id
    });
  } catch (error) {
    console.error("Astrologer login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ✅ Toggle Live Status
export const toggleLiveStatus = async (req, res) => {
  try {
    const astrologerId = req.user.id;

    if (!astrologerId) {
      return res.status(400).json({ message: "Astrologer ID not found" });
    }

    // Find user by ID
    const user = await User.findById(astrologerId);

    if (!user || user.role !== "astrologer") {
      return res.status(404).json({ message: "Astrologer not found" });
    }

    // Flip isOnline field (true→false, false→true)
    user.isOnline = !user.isOnline;

    // Save and return new isOnline status
    await user.save();

    res.status(200).json({
      message: `Status updated to ${user.isOnline ? "online" : "offline"}`,
      isOnline: user.isOnline
    });
  } catch (error) {
    console.error("Toggle live status error:", error);
    res.status(500).json({ message: "Server error while updating status" });
  }
};

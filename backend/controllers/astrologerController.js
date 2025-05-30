import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const astrologerSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      gender,
      dob,
      location,
      expertise,
      yearsOfExperience,
      bio,
      languagesSpoken,
      pricePerMinute,
      role,
      country,city,state
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

    // Create and save new user
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
      country,city,state
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "Signup successful. Please verify your account."});
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
    const filter = { role: "astrologer" };

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
    const userId = req.user?.id; // <- from authMiddleware

    const files = req.files;

    if (!userId || !files?.aadhaar || !files?.pan || !files?.education || !files?.bank) {
      return res.status(400).json({ error: 'Missing fields or userId' });
    }

    // ✅ Extract uploaded Cloudinary URLs directly
    const aadhaarUrl = files.aadhaar[0].path;
    const panUrl = files.pan[0].path;
    const educationUrl = files.education[0].path;
    const bankUrl = files.bank[0].path;

    const updated = await Astrologer.findOneAndUpdate(
      { userId },
      {
        documents: {
          aadhaar: aadhaarUrl,
          pan: panUrl,
          education: educationUrl,
          bank: bankUrl,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, astrologer: updated });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload documents." });
  }
};

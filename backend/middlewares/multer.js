import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // your existing Cloudinary config

//
// ─── 1) PRODUCT STORAGE ───────────────────────────────────────────────────────
//
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    format: async () => "png",
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Export a single‐file middleware for product images
export const uploadSingleImage = productUpload.single("image");

//
// ─── 2) KYC STORAGE ────────────────────────────────────────────────────────────
//
const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // file.fieldname will be one of: "aadhaar", "pan", "education", "bank"
    // Each should go into its own subfolder under "kyc/"
    return {
      folder: `kyc/${file.fieldname}`,     // e.g. "kyc/aadhaar"
      format: "jpg",
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

const kycUpload = multer({ 
  storage: kycStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // you can adjust per‐file size if needed
  },
});

// Export a multi‐field middleware for all four KYC docs
export const uploadKycDocs = kycUpload.fields([
  { name: "aadhaar",   maxCount: 1 },
  { name: "pan",       maxCount: 1 },
  { name: "education", maxCount: 1 },
  { name: "bank",      maxCount: 1 },
]);

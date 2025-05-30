import {astrologerSignup , astrologerList, uploadDocuments} from "../controllers/astrologerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import express from "express";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/astrologer-signup", astrologerSignup);

router.get("/list", authMiddleware, astrologerList);

router.post(
  '/upload-documents', authMiddleware,
  upload.fields([
    { name: 'aadhaar' },
    { name: 'pan' },
    { name: 'education' },
    { name: 'bank' },
  ]),
  uploadDocuments
);
export default router;

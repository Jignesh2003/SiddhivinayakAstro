import {astrologerSignup , astrologerList, uploadDocuments, getAstrologerDetails} from "../controllers/astrologerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import express from "express";
import { uploadKycDocs } from "../middlewares/multer.js";

const router = express.Router();

router.post("/astrologer-signup", astrologerSignup);

router.get("/list", authMiddleware, astrologerList);

router.post(
  "/upload-documents",
  authMiddleware,
  uploadKycDocs,           // ← multer.fields() + CloudinaryStorage → kyc/<fieldname>/
  uploadDocuments      // ← your controller reads req.files.<field>[0].path
);

router.get("/astrologer-details",authMiddleware,getAstrologerDetails)


export default router;

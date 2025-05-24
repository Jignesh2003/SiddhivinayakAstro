import {astrologerSignup , astrologerList} from "../controllers/astrologerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/astrologer-signup",authMiddleware, astrologerSignup);

router.get("/list", authMiddleware, astrologerList);

export default router;

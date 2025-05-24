import {astrologerSignup , astrologerList} from "../controllers/astrologerController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/astrologer-signup", astrologerSignup);

router.get("/list", authMiddleware, astrologerList);

export default router;

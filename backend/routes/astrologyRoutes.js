import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js';
import { detailedKundli, detailedKundliMatching, detailedPanchang } from '../controllers/kudliController.js';

const router = express.Router()

router.get('/kundli/detailed', authMiddleware , detailedKundli)
router.get("/kundali-matching/detailed", detailedKundliMatching)  // Public - no auth
router.get("/panchang/detailed", authMiddleware, detailedPanchang)

export default router;
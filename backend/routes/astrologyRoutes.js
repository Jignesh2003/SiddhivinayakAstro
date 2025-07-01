import express from 'express'
import authMiddleware from '../middlewares/authMiddleware.js';
import { detailedKundli } from '../controllers/kudliController.js';

const router = express.Router()

router.get('/kundli/detailed', authMiddleware , detailedKundli)
router.get("/kundali-matching/detailed", authMiddleware, detailedKundliMatching)

export default router;

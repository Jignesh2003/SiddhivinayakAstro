import express from 'express'
import { generateKundaliPDF } from '../controllers/kundliPdfController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router()

router.post('/pdf',authMiddleware, generateKundaliPDF);

export default router;
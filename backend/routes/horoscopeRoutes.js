import express from 'express';
import { getPredictionBySign } from '../controllers/horoscopeController.js';

const router = express.Router();

router.get('/:sign', getPredictionBySign);
export default router;

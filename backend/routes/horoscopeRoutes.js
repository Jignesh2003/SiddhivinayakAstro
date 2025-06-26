import express from 'express';
import { dailyPrediction } from '../controllers/horoscopeController.js';

const router = express.Router();

router.get('/:sign',dailyPrediction );

export default router;

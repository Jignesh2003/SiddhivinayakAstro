// routes/admin.js
import express from 'express';
import { listProfiles, createProfile, updateProfile, deleteProfile, computeProfile } from '../controllers/numerologyController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/compute', authMiddleware, computeProfile);
router.get('/profiles', authMiddleware, listProfiles);
router.post('/profiles', authMiddleware, createProfile);
router.put('/profiles/:id', authMiddleware, updateProfile);
router.delete('/profiles/:id', authMiddleware, deleteProfile);

export default router;

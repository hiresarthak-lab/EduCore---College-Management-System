import express from 'express';
import * as authController from '../controllers/authController.ts';
import { authenticate } from '../middleware/authMiddleware.ts';
import { upload } from '../middleware/uploadMiddleware.ts';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

// Profile
router.patch('/profile', authenticate, upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'signaturePhoto', maxCount: 1 }]), authController.updateProfile);
router.get('/profile-photo/:id', authController.getProfilePhoto);
router.get('/signature-photo/:id', authController.getSignaturePhoto);

export default router;

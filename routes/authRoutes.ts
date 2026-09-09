import { Router } from 'express';
import { sendVerification, verifyOtp, register, login, getMe } from '../controller/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/send-verification', sendVerification);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;

import { Router } from 'express';
import { sendVerification, verifyOtp, register, login, getMe, checkAvailability, checkApplicationStatus } from '../controller/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/send-verification', sendVerification);
router.post('/verify-otp', verifyOtp);
router.post('/check-availability', checkAvailability);
router.post('/register', register);
router.post('/login', login);
router.post('/check-status', checkApplicationStatus);
router.get('/me', authenticateToken, getMe);

export default router;

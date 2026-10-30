import { Router } from 'express';
import { 
  sendVerification, verifyOtp, register, login, getMe, 
  checkAvailability, checkApplicationStatus,
  forgotPassword, resetPassword, changePassword, changeEmail, changeName, tempFixRoles
} from '../controller/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { registerLimiter, loginLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/send-verification', otpLimiter, sendVerification);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/check-availability', checkAvailability);
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/check-status', checkApplicationStatus);
router.get('/me', authenticateToken, getMe);

// Admin Password Management
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.post('/change-email', authenticateToken, changeEmail);
router.post('/change-name', authenticateToken, changeName);
router.get('/fix-roles', tempFixRoles);

export default router;

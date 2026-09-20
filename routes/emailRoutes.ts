import { Router } from 'express';
import {
  getEmailLogs,
  getEmailStats,
  resendEmail,
  deleteEmailLog,
} from '../controller/emailLogController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Email Logs & Delivery Tracking
router.get('/logs', authenticateToken, requireAdmin, getEmailLogs);
router.get('/stats', authenticateToken, requireAdmin, getEmailStats);
router.post('/logs/:id/resend', authenticateToken, requireAdmin, resendEmail);
router.delete('/logs/:id', authenticateToken, requireAdmin, deleteEmailLog);

export default router;

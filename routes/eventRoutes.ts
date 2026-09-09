import { Router } from 'express';
import { 
  getNotices, createNotice, updateNotice, deleteNotice,
  getSchedule, createSchedule, updateSchedule, deleteSchedule,
  getCultural, createCultural, updateCultural, deleteCultural
} from '../controller/eventController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/notices', getNotices);
router.post('/notices', authenticateToken, requireAdmin, createNotice);
router.put('/notices/:id', authenticateToken, requireAdmin, updateNotice);
router.delete('/notices/:id', authenticateToken, requireAdmin, deleteNotice);

router.get('/schedule', getSchedule);
router.post('/schedule', authenticateToken, requireAdmin, createSchedule);
router.put('/schedule/:id', authenticateToken, requireAdmin, updateSchedule);
router.delete('/schedule/:id', authenticateToken, requireAdmin, deleteSchedule);

router.get('/cultural', getCultural);
router.post('/cultural', authenticateToken, requireAdmin, createCultural);
router.put('/cultural/:id', authenticateToken, requireAdmin, updateCultural);
router.delete('/cultural/:id', authenticateToken, requireAdmin, deleteCultural);

export default router;

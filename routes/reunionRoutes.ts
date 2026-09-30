import { Router } from 'express';
import { getReunions, getActiveReunion, createReunion, updateReunion, deleteReunion } from '../controller/reunionController';
import { requireAdmin, authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getReunions);
router.get('/active', getActiveReunion);
router.post('/', authenticateToken, requireAdmin, createReunion);
router.put('/:id', authenticateToken, requireAdmin, updateReunion);
router.delete('/:id', authenticateToken, requireAdmin, deleteReunion);

export default router;

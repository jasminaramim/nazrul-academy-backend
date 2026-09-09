import { Router } from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controller/studentController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getStudents);
router.post('/', authenticateToken, requireAdmin, createStudent);
router.put('/:id', authenticateToken, requireAdmin, updateStudent);
router.delete('/:id', authenticateToken, requireAdmin, deleteStudent);

export default router;

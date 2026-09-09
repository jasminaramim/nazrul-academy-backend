import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { 
  getGlobalConfig, updateGlobalConfig,
  getContact, updateContact,
  getAdminInfo, updateAdminInfo,
  getFinance, updateFinance,
  getStats, updateStats,
  getMongoConfig, updateMongoConfig, forceMongoSync, seedDemoData
} from '../controller/adminController';

const router = Router();

router.get('/global', getGlobalConfig);
router.put('/global', authenticateToken, requireAdmin, updateGlobalConfig);

router.get('/contact', getContact);
router.put('/contact', authenticateToken, requireAdmin, updateContact);

router.get('/admin/info', getAdminInfo);
router.put('/admin/info', authenticateToken, requireAdmin, updateAdminInfo);

router.get('/finance', getFinance);
router.put('/finance', authenticateToken, requireAdmin, updateFinance);

router.get('/stats', getStats);
router.put('/stats', authenticateToken, requireAdmin, updateStats);

router.get('/system/mongo-config', getMongoConfig);
router.post('/system/mongo-config', authenticateToken, requireAdmin, updateMongoConfig);
router.post('/system/mongo-sync', authenticateToken, requireAdmin, forceMongoSync);
router.post('/system/seed-demo-data', authenticateToken, requireAdmin, seedDemoData);

export default router;

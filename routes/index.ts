import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import eventRoutes from './eventRoutes';
import miscRoutes from './miscRoutes';
import adminRoutes from './adminRoutes';
import emailRoutes from './emailRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/', eventRoutes); // handles /notices, /schedule, /cultural
router.use('/', miscRoutes); // handles /donations, /gallery, /magazine, /hero, /teachers
router.use('/', adminRoutes); // handles /global, /contact, /admin/info, /finance, /stats
router.use('/emails', emailRoutes); // handles /logs, /stats, /resend

export default router;

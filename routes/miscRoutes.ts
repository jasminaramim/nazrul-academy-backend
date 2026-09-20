import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { 
  getDonors, createDonor, updateDonor, deleteDonor, submitPublicDonation, approveDonation,
  getGallery, createGallery, updateGallery, deleteGallery,
  getMagazine, createMagazine, updateMagazine, deleteMagazine
} from '../controller/mediaController';
import {
  getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getTeachers, createTeacher, updateTeacher, deleteTeacher
} from '../controller/contentController';
import { uploadImage } from '../controller/uploadController';

const router = Router();

// Upload Route (Public for registration)
router.post('/upload', uploadImage);

// Media Routes - Donations
router.get('/donations', getDonors);
router.post('/donations/submit', submitPublicDonation); // Public submission
router.put('/donations/:id/approve', authenticateToken, requireAdmin, approveDonation); // Admin approve & send email
router.post('/donations', authenticateToken, requireAdmin, createDonor);
router.put('/donations/:id', authenticateToken, requireAdmin, updateDonor);
router.delete('/donations/:id', authenticateToken, requireAdmin, deleteDonor);

router.get('/gallery', getGallery);
router.post('/gallery', authenticateToken, requireAdmin, createGallery);
router.put('/gallery/:id', authenticateToken, requireAdmin, updateGallery);
router.delete('/gallery/:id', authenticateToken, requireAdmin, deleteGallery);

router.get('/magazine', getMagazine);
router.post('/magazine', authenticateToken, requireAdmin, createMagazine);
router.put('/magazine/:id', authenticateToken, requireAdmin, updateMagazine);
router.delete('/magazine/:id', authenticateToken, requireAdmin, deleteMagazine);

// Content Routes
router.get('/hero', getHeroSlides);
router.post('/hero', authenticateToken, requireAdmin, createHeroSlide);
router.put('/hero/:id', authenticateToken, requireAdmin, updateHeroSlide);
router.delete('/hero/:id', authenticateToken, requireAdmin, deleteHeroSlide);

router.get('/teachers', getTeachers);
router.post('/teachers', authenticateToken, requireAdmin, createTeacher);
router.put('/teachers/:id', authenticateToken, requireAdmin, updateTeacher);
router.delete('/teachers/:id', authenticateToken, requireAdmin, deleteTeacher);

export default router;

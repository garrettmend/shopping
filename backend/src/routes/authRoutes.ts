import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/admin-status', authenticateToken, (req: any, res) => {
	const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
	const userEmail = req.user?.email?.trim().toLowerCase();
	res.json({ isAdmin: Boolean(adminEmail && userEmail && adminEmail === userEmail) });
});

export default router;

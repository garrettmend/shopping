import { Router } from 'express';
import { getProducts, getProductById, clearProductCache } from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.post('/cache/reset', authenticateToken, requireAdmin, clearProductCache);
router.get('/:id', getProductById);

export default router;

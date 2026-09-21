import { Router } from 'express';
import { getProducts, getProductById, clearProductCache, restoreStock } from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.post('/cache/reset', authenticateToken, requireAdmin, clearProductCache);
router.post('/stock/restore', authenticateToken, restoreStock);
router.get('/:id', getProductById);

export default router;

import { Router } from 'express';
import {
  getDashboardStats, getAllUsers, updateUserRole,
  deleteUser, getAllPostsAdmin, featurePost,
} from '../controllers/admin.controller';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/posts', getAllPostsAdmin);
router.patch('/posts/:id/feature', featurePost);

export default router;

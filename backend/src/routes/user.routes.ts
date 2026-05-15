import { Router } from 'express';
import {
  getUserProfile, updateProfile, toggleFollow,
  getUserPosts, toggleSavedPost, getSavedPosts,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../utils/schemas';

const router = Router();

router.get('/saved', protect, getSavedPosts);
router.post('/saved/:postId', protect, toggleSavedPost);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.get('/:username', getUserProfile);
router.get('/:username/posts', getUserPosts);
router.post('/:id/follow', protect, toggleFollow);

export default router;

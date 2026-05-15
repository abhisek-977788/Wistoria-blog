import { Router } from 'express';
import {
  getPosts, getPost, createPost, updatePost,
  deletePost, toggleLike, getTrendingPosts, getMyPosts,
} from '../controllers/post.controller';
import { protect, optionalAuth, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPostSchema, updatePostSchema } from '../utils/schemas';

const router = Router();

router.get('/trending', getTrendingPosts);
router.get('/my-posts', protect, getMyPosts);
router.get('/', optionalAuth, getPosts);
router.get('/:slug', optionalAuth, getPost);
router.post('/', protect, restrictTo('author', 'admin'), validate(createPostSchema), createPost);
router.put('/:id', protect, validate(updatePostSchema), updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLike);

export default router;

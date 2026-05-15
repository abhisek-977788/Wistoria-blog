import { Router } from 'express';
import {
  getComments, addComment, updateComment,
  deleteComment, toggleCommentLike,
} from '../controllers/comment.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../utils/schemas';

const router = Router();

router.get('/:postId', getComments);
router.post('/:postId', protect, validate(createCommentSchema), addComment);
router.patch('/:id', protect, validate(createCommentSchema), updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleCommentLike);

export default router;

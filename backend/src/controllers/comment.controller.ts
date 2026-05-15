import { Request, Response, NextFunction } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, getPaginationParams, sendPaginated } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// @desc    Get comments for a post (top-level only)
// @route   GET /api/v1/comments/:postId
// @access  Public
export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [comments, total] = await Promise.all([
      Comment.find({ post: req.params.postId, parent: null, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username avatar')
        .populate({
          path: 'replies',
          match: { isDeleted: false },
          populate: { path: 'author', select: 'name username avatar' },
          options: { sort: { createdAt: 1 }, limit: 5 },
        })
        .lean(),
      Comment.countDocuments({ post: req.params.postId, parent: null, isDeleted: false }),
    ]);

    sendPaginated(res, comments, page, limit, total, 'Comments fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment or reply
// @route   POST /api/v1/comments/:postId
// @access  Private
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(new AppError('Post not found', 404));

    const commentData: any = {
      content: req.body.content,
      author: req.user!._id,
      post: post._id,
    };

    if (req.body.parent) {
      const parentComment = await Comment.findById(req.body.parent);
      if (!parentComment) return next(new AppError('Parent comment not found', 404));
      commentData.parent = parentComment._id;
    }

    const comment = await Comment.create(commentData);

    // Add to post comments array & parent replies
    await Post.findByIdAndUpdate(post._id, { $push: { comments: comment._id } });
    if (req.body.parent) {
      await Comment.findByIdAndUpdate(req.body.parent, { $push: { replies: comment._id } });
    }

    await comment.populate('author', 'name username avatar');
    sendSuccess(res, { comment }, 'Comment added', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PATCH /api/v1/comments/:id
// @access  Private (owner)
export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError('Comment not found', 404));

    if (comment.author.toString() !== req.user!._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    sendSuccess(res, { comment }, 'Comment updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (soft delete)
// @route   DELETE /api/v1/comments/:id
// @access  Private (owner or admin)
export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError('Comment not found', 404));

    const isOwner = comment.author.toString() === req.user!._id.toString();
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    await comment.save();

    sendSuccess(res, null, 'Comment deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a comment
// @route   POST /api/v1/comments/:id/like
// @access  Private
export const toggleCommentLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError('Comment not found', 404));

    const userId = req.user!._id;
    const alreadyLiked = comment.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      comment.likes.push(userId as any);
    }

    await comment.save();
    sendSuccess(res, { liked: !alreadyLiked, likeCount: comment.likes.length }, alreadyLiked ? 'Comment unliked' : 'Comment liked');
  } catch (error) {
    next(error);
  }
};

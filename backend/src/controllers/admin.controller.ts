import { Response, NextFunction } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { sendSuccess, getPaginationParams, sendPaginated } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalPosts, totalComments, publishedPosts, draftPosts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
    ]);

    const topPosts = await Post.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .populate('author', 'name username')
      .select('title views likes readingTime publishedAt')
      .lean();

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name username email role createdAt')
      .lean();

    sendSuccess(res, {
      stats: { totalUsers, totalPosts, publishedPosts, draftPosts, totalComments },
      topPosts,
      recentUsers,
    }, 'Dashboard stats fetched');
  } catch (error) { next(error); }
};

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-refreshTokens').lean(),
      User.countDocuments(),
    ]);
    sendPaginated(res, users, page, limit, total, 'Users fetched');
  } catch (error) { next(error); }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user', 'author', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-refreshTokens');
    if (!user) return next(new AppError('User not found', 404));
    sendSuccess(res, { user }, 'User role updated');
  } catch (error) { next(error); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    sendSuccess(res, null, 'User deleted');
  } catch (error) { next(error); }
};

export const getAllPostsAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status } = req.query as { status?: string };
    const filter: any = {};
    if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('author', 'name username').populate('category', 'name slug').select('-content').lean(),
      Post.countDocuments(filter),
    ]);
    sendPaginated(res, posts, page, limit, total, 'All posts fetched');
  } catch (error) { next(error); }
};

export const featurePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));
    post.isFeatured = !post.isFeatured;
    await post.save();
    sendSuccess(res, { isFeatured: post.isFeatured }, post.isFeatured ? 'Post featured' : 'Post unfeatured');
  } catch (error) { next(error); }
};

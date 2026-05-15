import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Post from '../models/Post';
import cloudinary, { getPublicIdFromUrl } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendPaginated, getPaginationParams } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// @desc    Get user profile by username
// @route   GET /api/v1/users/:username
// @access  Public
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-refreshTokens -passwordResetToken -passwordResetExpires')
      .lean();

    if (!user) return next(new AppError('User not found', 404));

    const postCount = await Post.countDocuments({ author: user._id, status: 'published' });

    sendSuccess(res, { user: { ...user, postCount } }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PATCH /api/v1/users/me
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, bio, website, avatar, avatarPublicId } = req.body;
    const currentUser = await User.findById(req.user?._id);
    if (!currentUser) return next(new AppError('User not found', 404));

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, bio, website, avatar, avatarPublicId },
      { new: true, runValidators: true }
    ).select('-__v');

    const previousPublicId = currentUser.avatarPublicId || getPublicIdFromUrl(currentUser.avatar);
    if (avatar !== undefined && currentUser.avatar && currentUser.avatar !== avatar && previousPublicId) {
      await cloudinary.uploader.destroy(previousPublicId).catch(() => undefined);
    }

    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Follow / Unfollow a user
// @route   POST /api/v1/users/:id/follow
// @access  Private
export const toggleFollow = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = String(req.params.id);
    const currentUserId = req.user!._id.toString();

    if (targetId === currentUserId) {
      return next(new AppError('You cannot follow yourself', 400));
    }

    const target = await User.findById(targetId);
    if (!target) return next(new AppError('User not found', 404));

    const targetObjId = new mongoose.Types.ObjectId(targetId);
    const currentObjId = req.user!._id as mongoose.Types.ObjectId;
    const isFollowing = target.followers.some((id) => id.toString() === currentUserId);

    if (isFollowing) {
      await User.findByIdAndUpdate(targetId, { $pull: { followers: currentObjId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetObjId } });
      sendSuccess(res, null, `Unfollowed ${target.name}`);
    } else {
      await User.findByIdAndUpdate(targetId, { $push: { followers: currentObjId } });
      await User.findByIdAndUpdate(currentUserId, { $push: { following: targetObjId } });
      sendSuccess(res, null, `Now following ${target.name}`);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by a user
// @route   GET /api/v1/users/:username/posts
// @access  Public
export const getUserPosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return next(new AppError('User not found', 404));

    const { page, limit, skip } = getPaginationParams(req.query);

    const query: any = { author: user._id };
    // Only show drafts to the owner
    if (req.user?._id.toString() !== user._id.toString()) {
      query.status = 'published';
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug color')
        .select('-content')
        .lean(),
      Post.countDocuments(query),
    ]);

    sendPaginated(res, posts, page, limit, total, 'User posts fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Save / Unsave a post
// @route   POST /api/v1/users/saved/:postId
// @access  Private
export const toggleSavedPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = new mongoose.Types.ObjectId(String(req.params.postId));
    const user = await User.findById(req.user!._id);

    if (!user) return next(new AppError('User not found', 404));

    const isSaved = user.savedPosts.some((id) => id.toString() === postId.toString());

    if (isSaved) {
      await User.findByIdAndUpdate(user._id, { $pull: { savedPosts: postId } });
      sendSuccess(res, null, 'Post removed from saved');
    } else {
      await User.findByIdAndUpdate(user._id, { $push: { savedPosts: postId } });
      sendSuccess(res, null, 'Post saved successfully');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved posts
// @route   GET /api/v1/users/saved
// @access  Private
export const getSavedPosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const user = await User.findById(req.user!._id).select('savedPosts');
    if (!user) return next(new AppError('User not found', 404));

    const total = user.savedPosts.length;
    const savedPostIds = user.savedPosts.slice(skip, skip + limit);

    const posts = await Post.find({ _id: { $in: savedPostIds }, status: 'published' })
      .populate('author', 'name username avatar')
      .populate('category', 'name slug color')
      .select('-content')
      .lean();

    sendPaginated(res, posts, page, limit, total, 'Saved posts fetched');
  } catch (error) {
    next(error);
  }
};

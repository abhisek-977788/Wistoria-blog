import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import Category from '../models/Category';
import cloudinary, { getPublicIdFromUrl } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess, sendPaginated, getPaginationParams } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all published posts (with search, filter, sort, pagination)
// @route   GET /api/v1/posts
// @access  Public
export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, category, tag, sort, featured } = req.query as Record<string, string>;

    const filter: any = { status: 'published' };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    if (tag) filter.tags = { $in: [tag] };
    if (featured === 'true') filter.isFeatured = true;

    const sortOptions: Record<string, any> = {
      latest: { publishedAt: -1 },
      oldest: { publishedAt: 1 },
      popular: { views: -1 },
      trending: { likes: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.latest;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username avatar')
        .populate('category', 'name slug color icon')
        .select('-content')
        .lean(),
      Post.countDocuments(filter),
    ]);

    sendPaginated(res, posts, page, limit, total, 'Posts fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by slug
// @route   GET /api/v1/posts/:slug
// @access  Public
export const getPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const identifier = String(req.params.slug);
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const postDoc = await Post.findOne(query)
      .populate('author', 'name username avatar bio followerCount')
      .populate('category', 'name slug color');

    if (!postDoc) return next(new AppError('Post not found', 404));

    const authorId = (postDoc.author as any)._id?.toString() || postDoc.author.toString();
    const canViewDraft =
      postDoc.status === 'published' ||
      (req.user && (req.user.role === 'admin' || req.user._id.toString() === authorId));

    if (!canViewDraft) return next(new AppError('Post not found', 404));

    if (postDoc.status === 'published' && !isObjectId) {
      postDoc.views += 1;
      await postDoc.save();
    }

    const post = postDoc.toObject();
    sendSuccess(res, { post }, 'Post fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post
// @route   POST /api/v1/posts
// @access  Private (Author, Admin)
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.create({ ...req.body, author: req.user!._id });

    // Update category post count
    if (post.status === 'published') {
      await Category.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });
    }

    await post.populate('category', 'name slug color');
    sendSuccess(res, { post }, 'Post created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/v1/posts/:id
// @access  Private (Author who owns it, Admin)
export const updatePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));

    const isOwner = post.author.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('You are not authorized to update this post', 403));
    }

    const wasPublished = post.status === 'published';
    const previousCategory = post.category.toString();
    const previousImage = post.coverImage;
    const previousImagePublicId = post.coverImagePublicId || getPublicIdFromUrl(post.coverImage);
    const willBePublished = req.body.status ? req.body.status === 'published' : wasPublished;

    Object.assign(post, req.body);
    await post.save();

    const nextCategory = post.category.toString();
    if (previousImage && previousImage !== post.coverImage && previousImagePublicId) {
      await cloudinary.uploader.destroy(previousImagePublicId).catch(() => undefined);
    }

    if (!wasPublished && willBePublished) {
      await Category.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });
    } else if (wasPublished && !willBePublished) {
      await Category.findByIdAndUpdate(previousCategory, { $inc: { postCount: -1 } });
    } else if (wasPublished && willBePublished && previousCategory !== nextCategory) {
      await Promise.all([
        Category.findByIdAndUpdate(previousCategory, { $inc: { postCount: -1 } }),
        Category.findByIdAndUpdate(nextCategory, { $inc: { postCount: 1 } }),
      ]);
    }

    sendSuccess(res, { post }, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/v1/posts/:id
// @access  Private (Author who owns it, Admin)
export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));

    const isOwner = post.author.toString() === req.user!._id.toString();
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    if (post.status === 'published') {
      await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
    }

    const publicId = post.coverImagePublicId || getPublicIdFromUrl(post.coverImage);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => undefined);
    }

    await post.deleteOne();
    sendSuccess(res, null, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a post
// @route   POST /api/v1/posts/:id/like
// @access  Private
export const toggleLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404));

    const userId = req.user!._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId as any);
    }

    await post.save();
    sendSuccess(res, { liked: !alreadyLiked, likeCount: post.likes.length }, alreadyLiked ? 'Post unliked' : 'Post liked');
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending posts
// @route   GET /api/v1/posts/trending
// @access  Public
export const getTrendingPosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posts = await Post.find({ status: 'published' })
      .sort({ views: -1, likes: -1 })
      .limit(6)
      .populate('author', 'name username avatar')
      .populate('category', 'name slug color')
      .select('-content')
      .lean();

    sendSuccess(res, { posts }, 'Trending posts fetched');
  } catch (error) {
    next(error);
  }
};

// @desc    Get author's own posts (drafts + published)
// @route   GET /api/v1/posts/my-posts
// @access  Private
export const getMyPosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status } = req.query as { status?: string };

    const filter: any = { author: req.user!._id };
    if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug color')
        .select('-content')
        .lean(),
      Post.countDocuments(filter),
    ]);

    sendPaginated(res, posts, page, limit, total, 'My posts fetched');
  } catch (error) {
    next(error);
  }
};

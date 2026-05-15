import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, setCookies, clearCookies } from '../utils/jwt';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(
        new AppError(
          existingUser.email === email ? 'Email already registered' : 'Username already taken',
          409
        )
      );
    }

    const user = await User.create({ name, username, email, password });

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    // Save refresh token
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    setCookies(res, accessToken, refreshToken);

    sendSuccess(
      res,
      {
        user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
        accessToken,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    // Keep max 5 sessions per user
    const tokens = user.refreshTokens || [];
    if (tokens.length >= 5) tokens.shift();
    tokens.push(refreshToken);
    await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

    setCookies(res, accessToken, refreshToken);

    sendSuccess(
      res,
      {
        user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
        accessToken,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public (with refresh token cookie)
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return next(new AppError('No refresh token provided', 401));

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Rotate tokens
    const newAccess = generateAccessToken({ id: user._id.toString(), role: user.role });
    const newRefresh = generateRefreshToken({ id: user._id.toString(), role: user.role });

    const tokens = user.refreshTokens.filter((t) => t !== token);
    tokens.push(newRefresh);
    await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

    setCookies(res, newAccess, newRefresh);
    sendSuccess(res, { accessToken: newAccess }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token && req.user) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
    }
    clearCookies(res);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-__v');
    sendSuccess(res, { user }, 'Current user fetched');
  } catch (error) {
    next(error);
  }
};

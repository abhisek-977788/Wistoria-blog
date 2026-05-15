import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find().sort({ postCount: -1 }).lean();
    sendSuccess(res, { categories }, 'Categories fetched');
  } catch (error) { next(error); }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.create(req.body);
    sendSuccess(res, { category }, 'Category created', 201);
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return next(new AppError('Category not found', 404));
    sendSuccess(res, { category }, 'Category updated');
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(new AppError('Category not found', 404));
    sendSuccess(res, null, 'Category deleted');
  } catch (error) { next(error); }
};

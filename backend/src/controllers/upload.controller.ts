import { Response, NextFunction } from 'express';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) return next(new AppError('No file uploaded', 400));

    const uploadPromise = new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'wistoria',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          max_bytes: 5 * 1024 * 1024,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      const readable = Readable.from(req.file!.buffer);
      readable.pipe(stream);
    });

    const result = await uploadPromise;
    sendSuccess(res, { url: result.secure_url, public_id: result.public_id }, 'Image uploaded');
  } catch (error) { next(error); }
};

export const deleteImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { public_id } = req.body;
    if (!public_id) return next(new AppError('public_id is required', 400));
    await cloudinary.uploader.destroy(public_id);
    sendSuccess(res, null, 'Image deleted');
  } catch (error) { next(error); }
};

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const getPublicIdFromUrl = (url?: string): string | null => {
  if (!url) return null;

  try {
    const { pathname } = new URL(url);
    const segments = pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');

    if (uploadIndex === -1) return null;

    const versionIndex = segments.findIndex((segment, index) => {
      return index > uploadIndex && /^v\d+$/.test(segment);
    });

    const publicIdParts = segments.slice(versionIndex === -1 ? uploadIndex + 1 : versionIndex + 1);
    const publicId = publicIdParts.join('/').replace(/\.[a-zA-Z0-9]+$/, '');

    return publicId ? decodeURIComponent(publicId) : null;
  } catch {
    return null;
  }
};

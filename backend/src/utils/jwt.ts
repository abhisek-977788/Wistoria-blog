import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Response } from 'express';

export interface TokenPayload {
  id: string;
  role: string;
}

const getJwtSecret = (secret: string | undefined): string => {
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return secret;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(env.JWT_ACCESS_SECRET), {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(env.JWT_REFRESH_SECRET), {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret(env.JWT_REFRESH_SECRET)) as TokenPayload;
};

export const setCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });
};

export const clearCookies = (res: Response): void => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
};

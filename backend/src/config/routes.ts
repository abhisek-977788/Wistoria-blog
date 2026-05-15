import { Application } from 'express';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.routes';
import postRoutes from '../routes/post.routes';
import commentRoutes from '../routes/comment.routes';
import categoryRoutes from '../routes/category.routes';
import adminRoutes from '../routes/admin.routes';
import uploadRoutes from '../routes/upload.routes';
import { getDBStatus } from './db';

export const configureRoutes = (app: Application): void => {
  const API_PREFIX = '/api/v1';

  const healthPayload = () => ({
    success: true,
    message: 'Wistoria API is healthy',
    database: getDBStatus(),
    timestamp: new Date().toISOString(),
  });

  app.get('/', (_req, res) => {
    res.json(healthPayload());
  });

  app.get('/health', (_req, res) => {
    res.json(healthPayload());
  });

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json(healthPayload());
  });

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/posts`, postRoutes);
  app.use(`${API_PREFIX}/comments`, commentRoutes);
  app.use(`${API_PREFIX}/categories`, categoryRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  app.use(`${API_PREFIX}/upload`, uploadRoutes);
};

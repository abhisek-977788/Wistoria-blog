import express from 'express';
import http from 'http';
import { connectDB } from './config/db';
import { configureMiddleware } from './config/middleware';
import { configureRoutes } from './config/routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { env } from './config/env';

const app = express();
const server = http.createServer(app);

// Database
connectDB();

// Middleware
configureMiddleware(app);

// Routes
configureRoutes(app);

// Error Handling (must be after routes)
app.use(notFound);
app.use(errorHandler);

server.listen(env.PORT, () => {
  console.log(`\n🚀 Wistoria API running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`   → http://localhost:${env.PORT}/api/v1\n`);
});

export default app;

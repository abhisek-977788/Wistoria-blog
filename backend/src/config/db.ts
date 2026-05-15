import mongoose from 'mongoose';
import { env } from './env';

let listenersAttached = false;
let retryTimer: NodeJS.Timeout | null = null;

export const getDBStatus = (): string => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error);

    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connectDB();
      }, 10000);
    }
  }

  if (!listenersAttached) {
    listenersAttached = true;

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
  }
};

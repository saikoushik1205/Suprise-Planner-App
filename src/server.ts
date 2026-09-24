import cors, { type CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { connectDatabase, getDatabaseStatus } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { authRoutes } from './routes/authRoutes.js';
import { surpriseRoutes } from './routes/surpriseRoutes.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const app = express();

function isDevOrigin(origin: string): boolean {
  return (
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)
  );
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed = process.env.CLIENT_URL;
    if (allowed && origin === allowed) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== 'production' && isDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: getDatabaseStatus(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/surprises', surpriseRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed.';
    console.error(message);
    process.exit(1);
  }
}

void start();

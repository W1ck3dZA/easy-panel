import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import directoryRoutes from './routes/directory';
import callsRoutes from './routes/calls';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    message: 'FOP Panel Backend Service is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/calls', callsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log('=================================');
  console.log('FOP Panel Backend Service');
  console.log('=================================');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API Base URL: ${config.api.baseUrl}`);
  console.log(`CORS Origin: ${config.cors.origin}`);
  console.log('=================================');
});

export default app;

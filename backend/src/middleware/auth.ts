import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { JwtPayload } from '../types';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authService.extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
    });
    return;
  }

  const payload = authService.verifyToken(token);

  if (!payload) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  req.user = payload;
  next();
};

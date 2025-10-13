import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { LoginRequest } from '../types';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with external API
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, domain, accountId } = req.body as LoginRequest;

    // Validate input
    if (!username || !password || !domain || !accountId) {
      res.status(400).json({
        success: false,
        error: 'Username, password, domain, and Account ID are required',
      });
      return;
    }

    const result = await authService.login({ username, password, domain, accountId });

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Login route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

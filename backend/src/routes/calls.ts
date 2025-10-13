import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { callService } from '../services/callService';

const router = Router();

/**
 * GET /api/calls
 * Get active calls (protected route)
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.externalToken || !req.user?.accountId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await callService.getActiveCalls(req.user.externalToken, req.user.accountId);

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Calls route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

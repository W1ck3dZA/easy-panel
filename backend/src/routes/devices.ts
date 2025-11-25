import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { deviceService } from '../services/deviceService';

const router = Router();

/**
 * GET /api/devices
 * Get devices for the authenticated user (protected route)
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.externalToken || !req.user?.accountId || !req.user?.userId || !req.user?.domain) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await deviceService.getDevices(
      req.user.externalToken,
      req.user.accountId,
      req.user.userId,
      req.user.domain
    );

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Devices route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { directoryService } from '../services/directoryService';

const router = Router();

/**
 * GET /api/directory
 * Get directory data (protected route)
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

    const result = await directoryService.getDirectory(req.user.externalToken, req.user.accountId);

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Directory route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/phonebook.xml
 * Generate XML phonebook for Yealink phones (protected route)
 */
router.get('/phonebook.xml', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.externalToken || !req.user?.accountId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const xml = await directoryService.generatePhonebookXml(req.user.externalToken, req.user.accountId);
    
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    console.error('Phonebook XML route error:', error);
    res.status(500).send('<Error>Failed to generate phonebook</Error>');
  }
});

export default router;

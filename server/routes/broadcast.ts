import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { broadcastEntry, broadcastStatus, broadcastClear } from '../services/broadcastServer.js';

const router = Router();

/**
 * POST /api/broadcast/entry
 * Admin pushes a transcript entry to all connected viewers.
 */
router.post(
  '/entry',
  asyncHandler(async (req: Request, res: Response) => {
    const entry = req.body;
    if (!entry || !entry.text) {
      return res.status(400).json({ success: false, error: 'Missing entry data' });
    }
    broadcastEntry(entry);
    res.json({ success: true });
  })
);

/**
 * POST /api/broadcast/status
 * Admin signals start/stop of a live session.
 */
router.post(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { isLive } = req.body;
    if (typeof isLive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isLive must be boolean' });
    }
    broadcastStatus(isLive);
    res.json({ success: true });
  })
);

/**
 * POST /api/broadcast/clear
 * Admin clears all transcript entries.
 */
router.post(
  '/clear',
  asyncHandler(async (_req: Request, res: Response) => {
    broadcastClear();
    res.json({ success: true });
  })
);

export default router;

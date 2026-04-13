import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createTemporaryApiKey } from '../services/sonioxService.js';

const router = Router();

/**
 * POST /api/soniox/temporary-key
 *
 * Creates a short-lived Soniox API key so the browser can open
 * a WebSocket to wss://stt-rt.soniox.com/transcribe-websocket
 * without exposing the real API key.
 */
router.post(
  '/temporary-key',
  asyncHandler(async (_req: Request, res: Response) => {
    const apiKey = process.env.SONIOX_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'SONIOX_API_KEY is not configured on the server.',
      });
    }

    const result = await createTemporaryApiKey(apiKey);

    res.json({
      success: true,
      data: {
        apiKey: result.api_key,
        expiresAt: result.expires_at,
        wsUrl: 'wss://stt-rt.soniox.com/transcribe-websocket',
      },
    });
  })
);

export default router;

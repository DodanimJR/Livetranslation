import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createSonioxSession,
  getSonioxSession,
  endSonioxSession,
  getSonioxWebSocketUrl,
} from '../services/sonioxService.js';

const router = Router();

/**
 * POST /api/soniox/sessions
 * Create a new Soniox transcription session
 */
router.post(
  '/sessions',
  asyncHandler(async (req: Request, res: Response) => {
    const { audioModel, languageCode, enableTranslation, translationLanguageCode } = req.body;

    if (!languageCode) {
      return res.status(400).json({
        success: false,
        error: 'languageCode is required',
      });
    }

    const session = await createSonioxSession({
      audioModel,
      languageCode,
      enableTranslation,
      translationLanguageCode,
    });

    // Also return the WebSocket URL for easy client access
    const wsUrl = getSonioxWebSocketUrl(session.sessionId);

    res.status(201).json({
      success: true,
      data: {
        ...session,
        wsUrl,
      },
    });
  })
);

/**
 * GET /api/soniox/sessions/:sessionId
 * Get session details
 */
router.get(
  '/sessions/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

    const session = await getSonioxSession(sessionId);

    res.json({
      success: true,
      data: session,
    });
  })
);

/**
 * POST /api/soniox/sessions/:sessionId/end
 * End a transcription session
 */
router.post(
  '/sessions/:sessionId/end',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

    const result = await endSonioxSession(sessionId);

    res.json({
      success: true,
      data: result,
      message: 'Session ended successfully',
    });
  })
);

/**
 * GET /api/soniox/sessions/:sessionId/ws-url
 * Get WebSocket URL for a session
 */
router.get(
  '/sessions/:sessionId/ws-url',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

    const wsUrl = getSonioxWebSocketUrl(sessionId);

    res.json({
      success: true,
      data: { wsUrl },
    });
  })
);

export default router;

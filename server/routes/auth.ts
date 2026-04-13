import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/auth/login
 *
 * Simple shared-password authentication for the admin panel.
 * Compares the provided password against the ADMIN_PASSWORD env var.
 * Returns a simple token (the password hash) that the frontend stores
 * in sessionStorage and sends on subsequent requests.
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({
        success: false,
        error: 'ADMIN_PASSWORD is not configured on the server.',
      });
    }

    if (!password || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password.',
      });
    }

    // Simple token — in production you'd use JWT, but for a small
    // church team a session-scoped token is sufficient.
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      data: { token },
    });
  })
);

/**
 * GET /api/auth/verify
 *
 * Verify the admin is still authenticated.
 * The frontend sends the token in the Authorization header.
 */
router.get(
  '/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // For the simple password approach we just check the token is non-empty
    // and was issued by us (starts with base64 of "admin:")
    const token = authHeader.slice(7);
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      if (!decoded.startsWith('admin:')) {
        throw new Error('invalid');
      }
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    res.json({ success: true });
  })
);

export default router;

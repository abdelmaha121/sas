import { Request, Response, NextFunction } from 'express';
import logger from '../utils/Logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ التحقق من وجود Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn(`[AUTH] Missing authorization header from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Missing authorization header',
        errorCode: 'MISSING_AUTH_HEADER'
      });
    }

    // ✅ استخراج token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      logger.warn(`[AUTH] Invalid token format from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        errorCode: 'INVALID_TOKEN_FORMAT'
      });
    }

    // ✅ التحقق من صحة token (يمكن استبداله بـ JWT verification)
    // هذا مثال مبسط - استخدم JWT في الإنتاج
    const mockUser = {
      id: 'user-123',
      email: 'client@example.com',
      role: 'client'
    };

    req.user = mockUser;
    logger.info(`[AUTH] User authenticated: ${mockUser.id}`);
    next();

  } catch (error: any) {
    logger.error(`[AUTH] Authentication error: ${error.message}`, error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      errorCode: 'AUTH_ERROR'
    });
  }
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      const mockUser = {
        id: 'user-123',
        email: 'client@example.com',
        role: 'client'
      };

      req.user = mockUser;
    }
    
    next();
  } catch (error) {
    next();
  }
};

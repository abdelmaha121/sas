import { Request, Response, NextFunction } from 'express';
import logger from '../utils/Logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errorCode: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  if (error instanceof AppError) {
    logger.error(`[${error.errorCode}] ${error.message}`);

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`
    });
  }

  // معالجة الأخطاء العامة
  logger.error(`[UNHANDLED_ERROR] ${error.message}`, error.stack);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
};

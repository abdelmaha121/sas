import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateBookingCreation = [
  body('serviceId').isMongoId().withMessage('Invalid service ID'),
  body('providerId').isMongoId().withMessage('Invalid provider ID'),
  body('scheduledDate').isISO8601().custom((value) => {
    if (new Date(value) <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }
    return true;
  }),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('clientDetails.firstName').notEmpty().trim().withMessage('First name is required'),
  body('clientDetails.lastName').notEmpty().trim().withMessage('Last name is required'),
  body('clientDetails.email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('clientDetails.phone').matches(/^[0-9\-\+\(\)]+$/).withMessage('Invalid phone number'),
  body('clientDetails.address').notEmpty().trim().withMessage('Address is required'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

export const validateBookingConfirmation = [
  body('paymentMethod').isIn(['card', 'wallet', 'transfer']).withMessage('Invalid payment method'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

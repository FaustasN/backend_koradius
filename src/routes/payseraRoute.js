import { Router } from 'express';
import {
  createPayment,
  handlePayseraCallback,
  handlePayseraAccept,
  handlePayseraCancel
} from '../controllers/payseraController.js';
import { paymentCreateLimiter } from '../middleware/rateLimitMiddleware.js';

export const payseraRouter = Router();

payseraRouter.post('/create-payment', paymentCreateLimiter, createPayment);
payseraRouter.get('/callback', handlePayseraCallback);
payseraRouter.get('/accept', handlePayseraAccept);
payseraRouter.get('/cancel', handlePayseraCancel);
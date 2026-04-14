import { Router } from 'express';
import {
  createPayment,
  handlePayseraCallback,
  handlePayseraAccept,
  handlePayseraCancel
} from '../controllers/payseraController.js';

export const payseraRouter = Router();

payseraRouter.post('/create-payment', createPayment);
payseraRouter.get('/callback', handlePayseraCallback);
payseraRouter.get('/accept', handlePayseraAccept);
payseraRouter.get('/cancel', handlePayseraCancel);
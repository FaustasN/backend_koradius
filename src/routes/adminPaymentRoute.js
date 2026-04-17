import { Router } from 'express';
import { getAllPayments } from '../controllers/adminPaymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const adminPaymentRouter = Router();

adminPaymentRouter.get('/', authMiddleware,  getAllPayments);
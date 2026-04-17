

import { Router } from 'express';
import { createReview, getApprovedReviews } from '../controllers/reviewController.js';
import { reviewPostLimiter } from '../middleware/rateLimitMiddleware.js';

export const reviewRouter = Router();

reviewRouter.get('/approved', getApprovedReviews);
reviewRouter.post('/', reviewPostLimiter, createReview);

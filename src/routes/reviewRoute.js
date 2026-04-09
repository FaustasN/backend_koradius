

import { Router } from 'express';
import { createReview, getApprovedReviews } from '../controllers/reviewController.js';
export const reviewRouter = Router();

reviewRouter.get('/approved', getApprovedReviews);
reviewRouter.post('/', createReview);

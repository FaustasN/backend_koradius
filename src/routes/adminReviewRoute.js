

import { Router } from 'express';
import {authMiddleware} from '../middleware/authMiddleware.js';
import { getAllReviews, getApprovedReviews, approveReview, unapproveReview, updateReview, deleteReview } from '../controllers/adminReviewController.js';
export const adminReviewRouter = Router();
    

adminReviewRouter.get('/all',authMiddleware, getAllReviews);
adminReviewRouter.get('/approved',authMiddleware, getApprovedReviews);
adminReviewRouter.put('/:id/approve',authMiddleware, approveReview);
adminReviewRouter.put('/:id/unapprove',authMiddleware, unapproveReview);
adminReviewRouter.put('/:id',authMiddleware, updateReview);
adminReviewRouter.delete('/:id',authMiddleware, deleteReview);
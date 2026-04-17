import { Router } from 'express';
import { createContactRequest } from '../controllers/contactController.js';
import { getAllContacts } from '../controllers/contactController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { contactPostLimiter } from '../middleware/rateLimitMiddleware.js';

export const contactRouter = Router();

contactRouter.post('/', contactPostLimiter, createContactRequest);
contactRouter.get('/all', authMiddleware, getAllContacts);

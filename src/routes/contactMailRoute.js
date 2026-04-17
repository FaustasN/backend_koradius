import { Router } from 'express';
import { sendContactMail } from '../controllers/contactMailController.js';
import { contactPostLimiter } from '../middleware/rateLimitMiddleware.js';

export const contactMailRouter = Router();

contactMailRouter.post('/', contactPostLimiter, sendContactMail);

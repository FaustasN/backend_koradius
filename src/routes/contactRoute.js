import { Router } from 'express';
import { createContactRequest } from '../controllers/contactController.js';
import { getAllContacts } from '../controllers/contactController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
export const contactRouter = Router();

contactRouter.post('/', createContactRequest);
contactRouter.get('/all', authMiddleware, getAllContacts);

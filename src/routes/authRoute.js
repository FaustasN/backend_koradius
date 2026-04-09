import { Router } from 'express';
import { login, validate } from '../controllers/authController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/validate', authMiddleware, validate);
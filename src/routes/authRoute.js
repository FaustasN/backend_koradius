import { Router } from 'express';
import { login, validate, logout } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimitMiddleware.js';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, login);
authRouter.get('/validate', validate);
authRouter.post('/logout', logout);

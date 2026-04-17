import { Router } from 'express';
import { login, validate, logout } from '../controllers/authController.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/validate', validate);
authRouter.post('/logout', logout);

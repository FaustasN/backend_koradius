import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import uploadRoutes from './routes/uploadRoute.js';
import cookieParser from 'cookie-parser';
import { contactRouter } from './routes/contactRoute.js';
import { reviewRouter } from './routes/reviewRoute.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { galleryRouter } from './routes/galleryRoute.js';
import { travelPacketRouter } from './routes/travelPacketRoute.js';
import { authRouter } from './routes/authRoute.js';
import { adminReviewRouter } from './routes/adminReviewRoute.js';
import { payseraRouter } from './routes/payseraRoute.js';
import { adminPaymentRouter } from './routes/adminPaymentRoute.js';

const app = express();

app.use(helmet());

app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API is running' });
});

app.use('/api/contacts', contactRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/travel-packets', travelPacketRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/payments', adminPaymentRouter);
app.use('/api/admin/reviews', adminReviewRouter);
app.use('/api/admin/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/paysera', payseraRouter);
app.use(errorHandler);

export default app;
import rateLimit from 'express-rate-limit';

const jsonMessage = (message) => ({ message });

/** Admin login — tight window against credential stuffing */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: jsonMessage('Too many login attempts. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false
});

/** Public contact form */
export const contactPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: jsonMessage('Too many contact requests. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false
});

/** Public review submission */
export const reviewPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: jsonMessage('Too many review submissions. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false
});

/** Start payment flow — higher cost / abuse target */
export const paymentCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: jsonMessage('Too many payment attempts. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false
});

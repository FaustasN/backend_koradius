import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is missing in authMiddleware');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
    console.error('authMiddleware error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
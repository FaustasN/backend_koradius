import jwt from 'jsonwebtoken';

function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60
  };
}

export const login = (req, res) => {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;

  const { username, password } = req.body;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('adminToken', token, getAdminCookieOptions());

  return res.status(200).json({
    success: true,
    user: {
      username,
      role: 'admin'
    }
  });
};

export const validate = (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ valid: false, message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    return res.status(200).json({
      valid: true,
      user: {
        username: decoded.username,
        role: decoded.role
      }
    });
  } catch {
    return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};

export const logout = (_req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.status(200).json({
    success: true
  });
};
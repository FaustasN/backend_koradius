import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const createStorage = (folderName) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', folderName);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const uploadTravelPackets = multer({
  storage: createStorage('travel-packets'),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadGallery = multer({
  storage: createStorage('gallery'),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  '/travel-packets',
  authMiddleware,
  uploadTravelPackets.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/travel-packets/${req.file.filename}`;
    return res.status(201).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
    });
  }
);

router.post(
  '/gallery',
  authMiddleware,
  uploadGallery.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

   const fileUrl = `${req.protocol}://${req.get('host')}/uploads/gallery/${req.file.filename}`;

    return res.status(201).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
    });
  }
);

export default router;
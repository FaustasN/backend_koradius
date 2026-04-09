import { Router } from 'express';
import { getAllGalleryItems, createGalleryItem, updateGalleryItem, deleteGalleryItem, likeGalleryItem } from '../controllers/galleryController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
export const galleryRouter = Router();

galleryRouter.get('/', getAllGalleryItems);
galleryRouter.post('/', authMiddleware, createGalleryItem);
galleryRouter.put('/:id', authMiddleware, updateGalleryItem);
galleryRouter.delete('/:id', authMiddleware, deleteGalleryItem);
galleryRouter.post('/:id/like', likeGalleryItem);
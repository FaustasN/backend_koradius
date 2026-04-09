import { Router } from 'express';
import {
  getAllTravelPackets,
  createTravelPacket,
  updateTravelPacket,
  deleteTravelPacket
} from '../controllers/travelPacketController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const travelPacketRouter = Router();

travelPacketRouter.get('/', getAllTravelPackets);
travelPacketRouter.post('/',authMiddleware, createTravelPacket);
travelPacketRouter.put('/:id', authMiddleware, updateTravelPacket);
travelPacketRouter.delete('/:id', authMiddleware, deleteTravelPacket);
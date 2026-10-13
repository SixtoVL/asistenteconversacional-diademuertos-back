import { Router } from 'express';
import { postChat } from './chat.controller.js';

export const chatRoutes = Router();

chatRoutes.post('/', postChat);

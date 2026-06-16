import { Router } from 'express';
import Joi from 'joi';
import validate from '../middleware/validate';
import asyncHandler from '../middleware/asyncHandler';
import * as reminderController from '../controllers/reminderController';

const router = Router();

const upcomingQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(30).default(7),
});

router.get(
  '/upcoming',
  validate(upcomingQuerySchema, 'query'),
  asyncHandler(reminderController.getUpcomingReminders),
);

export default router;

import { Router } from 'express';
import Joi from 'joi';
import validate from '../middleware/validate';
import asyncHandler from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';

const router = Router();

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().max(150).required(),
});

router.get('/', asyncHandler(userController.getAllUsers));
router.post('/', validate(createUserSchema, 'body'), asyncHandler(userController.createUser));

export default router;

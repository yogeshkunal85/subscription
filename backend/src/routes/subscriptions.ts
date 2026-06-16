import { Router } from 'express';
import Joi from 'joi';
import validate from '../middleware/validate';
import asyncHandler from '../middleware/asyncHandler';
import * as subscriptionController from '../controllers/subscriptionController';
import { SUBSCRIPTION_NAME_REGEX, SUBSCRIPTION_NAME_JOI_MESSAGE } from '../utils/validation';

const router = Router();

const subscriptionNameField = Joi.string()
  .trim()
  .min(2)
  .max(150)
  .pattern(SUBSCRIPTION_NAME_REGEX)
  .messages({ 'string.pattern.base': SUBSCRIPTION_NAME_JOI_MESSAGE });

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('active', 'cancelled', 'expired').optional(),
  search: Joi.string().max(150).optional(),
});

const createSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  name: subscriptionNameField.required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).default('INR'),
  billing_cycle: Joi.string().valid('monthly', 'yearly', 'custom').required(),
  next_renewal_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'next_renewal_date must be in YYYY-MM-DD format' }),
});

const updateSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  name: subscriptionNameField.optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().max(10).optional(),
  billing_cycle: Joi.string().valid('monthly', 'yearly', 'custom').optional(),
  next_renewal_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'next_renewal_date must be in YYYY-MM-DD format' }),
}).min(1);

router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(subscriptionController.listSubscriptions),
);

router.get('/:id', asyncHandler(subscriptionController.getSubscription));

router.post(
  '/',
  validate(createSchema, 'body'),
  asyncHandler(subscriptionController.createSubscription),
);

router.put(
  '/:id',
  validate(updateSchema, 'body'),
  asyncHandler(subscriptionController.updateSubscription),
);

router.delete('/:id', asyncHandler(subscriptionController.cancelSubscription));

export default router;

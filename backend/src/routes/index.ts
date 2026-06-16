import { Router, Request, Response } from 'express';
import userRoutes from './users';
import subscriptionRoutes from './subscriptions';
import reminderRoutes from './reminders';
import asyncHandler from '../middleware/asyncHandler';
import { runRenewalJob } from '../jobs/renewalJob';

const router = Router();

router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/reminders', reminderRoutes);

// Dev-only route to manually trigger the cron job for testing
router.post(
  '/jobs/run-renewal',
  asyncHandler(async (_req: Request, res: Response) => {
    await runRenewalJob();
    res.json({ success: true, data: { message: 'Renewal job completed. Check server logs.' } });
  }),
);

export default router;

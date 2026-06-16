import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscriptionService';
import { ApiResponse, Subscription, SubscriptionStatus, BillingCycle } from '../types';

export async function listSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string, 10) || 1;
    const limit = parseInt(req.query['limit'] as string, 10) || 10;
    const status = req.query['status'] as SubscriptionStatus | undefined;
    const search = req.query['search'] as string | undefined;

    const { data, total } = await subscriptionService.listSubscriptions({
      page,
      limit,
      status,
      search,
    });

    const totalPages = Math.ceil(total / limit);

    const body: ApiResponse<Subscription[]> = {
      success: true,
      data,
      meta: { page, limit, total, totalPages },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params['id'], 10);
    const subscription = await subscriptionService.getSubscriptionById(id);

    if (!subscription) {
      next({ status: 404, code: 'NOT_FOUND', message: 'Subscription not found.' });
      return;
    }

    const body: ApiResponse<typeof subscription> = { success: true, data: subscription };
    res.json(body);
  } catch (err) {
    next(err);
  }
}

export async function createSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as {
      user_id: number;
      name: string;
      amount: number;
      currency: string;
      billing_cycle: BillingCycle;
      next_renewal_date: string;
    };

    const subscription = await subscriptionService.createSubscription(input);

    const body: ApiResponse<Subscription> = { success: true, data: subscription };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
}

export async function updateSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params['id'], 10);
    const updated = await subscriptionService.updateSubscription(id, req.body as Partial<Subscription>);

    if (!updated) {
      next({ status: 404, code: 'NOT_FOUND', message: 'Subscription not found.' });
      return;
    }

    const body: ApiResponse<Subscription> = { success: true, data: updated };
    res.json(body);
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params['id'], 10);
    const cancelled = await subscriptionService.cancelSubscription(id);

    if (!cancelled) {
      next({ status: 404, code: 'NOT_FOUND', message: 'Subscription not found.' });
      return;
    }

    const body: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Subscription cancelled.' },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
}

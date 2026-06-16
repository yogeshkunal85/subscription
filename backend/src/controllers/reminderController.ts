import { Request, Response, NextFunction } from 'express';
import * as reminderService from '../services/reminderService';
import { ApiResponse } from '../types';
import { EnrichedReminder } from '../services/reminderService';

export async function getUpcomingReminders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const days = parseInt(req.query['days'] as string, 10) || 7;
    const reminders = await reminderService.getUpcomingReminders(days);

    const body: ApiResponse<EnrichedReminder[]> = { success: true, data: reminders };
    res.json(body);
  } catch (err) {
    next(err);
  }
}

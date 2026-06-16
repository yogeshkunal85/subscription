export type BillingCycle = 'monthly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type ReminderStatus = 'pending' | 'sent';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: Date;
  status: SubscriptionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Reminder {
  id: number;
  subscription_id: number;
  remind_on: Date;
  status: ReminderStatus;
  created_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListParams {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
  search?: string;
}

export interface AppError {
  status: number;
  code: string;
  message: string;
}

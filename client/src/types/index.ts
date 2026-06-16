export type BillingCycle = 'monthly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type ReminderStatus = 'pending' | 'sent';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_renewal_date: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  reminders?: Reminder[];
}

export interface Reminder {
  id: number;
  subscription_id: number;
  subscription_name?: string;
  remind_on: string;
  status: ReminderStatus;
  user_email?: string;
  user_name?: string;
  amount?: number;
  currency?: string;
  created_at: string;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: Meta;
}

export interface SubscriptionFormData {
  name: string;
  amount: number | '';
  currency: string;
  billing_cycle: BillingCycle | '';
  next_renewal_date: string;
  user_id: number | '';
}

export interface ListParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus | 'all';
  search?: string;
}

export type FormErrors = Partial<Record<keyof SubscriptionFormData, string>>;

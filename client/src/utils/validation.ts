/**
 * Subscription / product names: letters, numbers, spaces, and common punctuation.
 * Blocks HTML-like input (e.g. <script>, <scprtd...) and other unsafe characters.
 */
export const SUBSCRIPTION_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9\s\-'&.()]*$/;

export const SUBSCRIPTION_NAME_MESSAGE =
  'Name must be 2–150 characters and contain only letters, numbers, spaces, and - \' & . ( )';

export function isValidSubscriptionName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 150 && SUBSCRIPTION_NAME_REGEX.test(trimmed);
}

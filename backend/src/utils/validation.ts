/** Subscription name: letters, numbers, spaces, and - ' & . ( ) only — no HTML tags. */
export const SUBSCRIPTION_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9\s\-'&.()]*$/;

export const SUBSCRIPTION_NAME_JOI_MESSAGE =
  "Name must be 2–150 characters and contain only letters, numbers, spaces, and - ' & . ( )";

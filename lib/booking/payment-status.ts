export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded", "failed"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

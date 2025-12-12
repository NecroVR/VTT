import { pgTable, text, timestamp, uuid, index, unique } from 'drizzle-orm/pg-core';
import { forms } from './forms.js';
import { users } from './users.js';

/**
 * Form Licenses table
 * Tracks user licenses/purchases for premium forms
 */
export const formLicenses = pgTable('form_licenses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // License Association
  formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // License Details
  licenseType: text('license_type').notNull(), // 'premium', 'subscription', etc.
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // null for perpetual licenses

  // Payment Tracking
  paymentId: text('payment_id'), // Reference to payment processor transaction
  subscriptionId: text('subscription_id'), // Reference to subscription if applicable

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  formIdIdx: index('idx_form_licenses_form').on(table.formId),
  userIdIdx: index('idx_form_licenses_user').on(table.userId),
  formUserUnique: unique('unq_form_licenses_form_user').on(table.formId, table.userId),
}));

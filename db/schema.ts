import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 1. Accounts (Checking, Savings, Cash)
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'checking', 'savings', 'cash'
  balance: real('balance').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 2. Category Groups (e.g., "Fixed Bills", "Variable")
export const categoryGroups = sqliteTable('category_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 3. Categories (The "Envelopes")
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').references(() => categoryGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budgeted: real('budgeted').notNull().default(0),
  available: real('available').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 4. Transactions
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  type: text('type').notNull().default('expense'), // 'expense', 'income', 'transfer'
  transferId: integer('transfer_id'), // Links the two sides of a transfer
  amount: real('amount').notNull(),
  payee: text('payee').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
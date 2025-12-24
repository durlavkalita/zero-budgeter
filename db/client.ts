import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('zero_budgeter.db');
export const db = drizzle(expoDb, { schema });

// Initialization function to create tables
export const initializeDb = async () => {
  // Creating the accounts table manually if it doesn't exist
  await expoDb.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_key = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS category_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER REFERENCES category_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      budgeted REAL NOT NULL DEFAULT 0,
      available REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      transfer_id INTEGER,
      amount REAL NOT NULL,
      payee TEXT NOT NULL,
      date INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 1. Update Account Balance on Transaction Delete
    CREATE TRIGGER IF NOT EXISTS update_balances_on_tx_delete
    AFTER DELETE ON transactions
    BEGIN
        -- Revert account balance
        UPDATE accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.account_id;
        
        -- Revert Category (Envelope) Available  Delete
        UPDATE categories 
        SET available = available - OLD.amount 
        WHERE id = OLD.category_id
        AND OLD.type != 'transfer'
        AND OLD.category_id IS NOT NULL;
    END;
    
    -- 2. Update balances when a NEW transaction is created
    CREATE TRIGGER IF NOT EXISTS update_balances_on_tx_insert
    AFTER INSERT ON transactions
    BEGIN
        -- Update Account
        UPDATE accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.account_id;

        -- Update Category (only if category_id is not null)
        UPDATE categories 
        SET available = available + NEW.amount 
        WHERE id = NEW.category_id
        AND NEW.type != 'transfer'
        AND NEW.category_id IS NOT NULL;
    END;

    -- 3. Automatic Cleanup for Transfers
    -- If one side of a transfer is deleted, the other side should be too
    CREATE TRIGGER IF NOT EXISTS cleanup_transfer_pair
    AFTER DELETE ON transactions
    FOR EACH ROW
    WHEN OLD.transfer_id IS NOT NULL
    BEGIN
        DELETE FROM transactions WHERE id = OLD.transfer_id;
    END;

    -- 4. Update transaction
    CREATE TRIGGER IF NOT EXISTS update_balances_on_tx_update
    AFTER UPDATE ON transactions
    BEGIN
        -- 1. Undo the OLD amount from the OLD account
        UPDATE accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.account_id;

        -- 2. Apply the NEW amount to the NEW account
        UPDATE accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.account_id;

        -- 3. Undo the OLD amount from the OLD category (if not a transfer)
        UPDATE categories 
        SET available = available - OLD.amount 
        WHERE id = OLD.category_id 
        AND OLD.type != 'transfer'
        AND OLD.category_id IS NOT NULL;

        -- 4. Apply the NEW amount to the NEW category (if not a transfer)
        UPDATE categories 
        SET available = available + NEW.amount 
        WHERE id = NEW.category_id 
        AND NEW.type != 'transfer'
        AND NEW.category_id IS NOT NULL;
    END;
  `);
};
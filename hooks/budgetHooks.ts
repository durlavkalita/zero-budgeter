import { db } from '@/db/client';
import { accounts, categories, categoryGroups, transactions } from '@/db/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq, sql, sum } from 'drizzle-orm';

// 1. Fetch all Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      return await db.select().from(accounts);
    },
  });
}

// 2. Fetch Categories grouped by their Parent Groups
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await db.select().from(categoryGroups);
      const cats = await db.select().from(categories);
      
      // Map categories into their respective groups for the UI
      return data.map(group => ({
        ...group,
        envelopes: cats.filter(c => c.groupId === group.id)
      }));
    },
  });
}

// 3. The "Ready to Assign" Logic
// Calculation: Total Account Balances - Total Available Budget in Envelopes
export function useBudgetSummary() {
  return useQuery({
    queryKey: ['budget-summary'],
    queryFn: async () => {
      const totalBalanceResult = await db.select({ 
        value: sum(accounts.balance) 
      }).from(accounts);

      const totalBudgetedResult = await db.select({ 
        value: sum(categories.budgeted) 
      }).from(categories);

      const allCategories = await db.select({ available: categories.available }).from(categories);
      
      const totalAvailable = allCategories.reduce((acc, cat) => {
        return acc + Math.max(0, cat.available);
      }, 0);

      const totalBalance = Number(totalBalanceResult[0]?.value) || 0;
      const totalBudgeted = Number(totalBudgetedResult[0]?.value) || 0;

      return {
        readyToAssign: totalBalance - totalAvailable,
        totalBalance,
        totalBudgeted,
        totalOverspent: allCategories.reduce((acc, cat) => acc + Math.min(0, cat.available), 0)
      };
    },
  });
}

export function useAssignMoney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, amount }: { categoryId: number; amount: number }) => {
      return await db.update(categories)
        .set({ 
          budgeted: sql`${categories.budgeted} + ${amount}`,
          available: sql`${categories.available} + ${amount}`
        })
        .where(eq(categories.id, categoryId));
    },
    onSuccess: () => {
      // Refresh the UI
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTx: {
      accountId: number;
      categoryId: number | null;
      type: string;
      transferId: number | null;
      amount: number; // Positive for income, negative for expense
      payee: string;
      date: Date;
    }) => {
      // 1. Record the transaction
      await db.insert(transactions).values(newTx);

      // taken care of in client.ts
      // 2. Update Account Balance
      // await db.update(accounts)
      //   .set({ balance: sql`${accounts.balance} + ${newTx.amount}` })
      //   .where(eq(accounts.id, newTx.accountId));

      // 3. Update Category "Available" balance (if category is selected)
      // if (newTx.categoryId) {
      //   await db.update(categories)
      //     .set({ available: sql`${categories.available} + ${newTx.amount}` })
      //     .where(eq(categories.id, newTx.categoryId));
      // }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });
}

// Example Join in budgetHooks.ts
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      return await db.select({
        id: transactions.id,
        amount: transactions.amount,
        payee: transactions.payee,
        date: transactions.date,
        type: transactions.type,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        accountName: accounts.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .all();
    }
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await db.delete(transactions).where(eq(transactions.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });
};

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await db
        .update(transactions)
        .set(updates)
        .where(eq(transactions.id, id));
    },
    onSuccess: () => {
      // Refresh all financial data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });
}
// src/services/financeService.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Account, Transaction } from '@/lib/types';

interface FinanceState {
  isLoaded: boolean;
  accounts: Account[];
  transactions: Transaction[];
  fetchData: () => Promise<void>;
  createAccount: (name: string, type: Account['type'], initialBalance: number) => Promise<void>;
  addTransaction: (details: Omit<Transaction, 'id' | 'timestamp' | 'user_id'>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // --- NEW ACTION ---
  deleteAccount: (accountId: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isLoaded: false,
  accounts: [],
  transactions: [],

  fetchData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: accounts } = await supabase.from('accounts').select('*');
    const { data: transactions } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
    set({ accounts: (accounts as Account[]) || [], transactions: (transactions as Transaction[]) || [], isLoaded: true });
  },

  createAccount: async (name, type, initialBalance) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newAccount } = await supabase.from('accounts').insert({ user_id: user.id, name, type, balance: initialBalance }).select().single();
    if (newAccount) {
      set(state => ({ accounts: [newAccount as Account, ...state.accounts] }));
    }
  },

  addTransaction: async (details) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('transactions').insert({ ...details, user_id: user.id });
    const account = get().accounts.find(acc => acc.id === details.account_id);
    if (!account) return;
    const newBalance = details.type === 'expense' ? account.balance - details.amount : account.balance + details.amount;
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', details.account_id);
    await get().fetchData();
  },

  deleteTransaction: async (transactionId: string) => {
    const transactionToDelete = get().transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;
    await supabase.from('transactions').delete().eq('id', transactionId);
    const account = get().accounts.find(acc => acc.id === transactionToDelete.account_id);
    if (!account) return;
    const newBalance = transactionToDelete.type === 'expense' ? account.balance + transactionToDelete.amount : account.balance - transactionToDelete.amount;
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', transactionToDelete.account_id);
    await get().fetchData();
  },

  // --- NEW ACTION IMPLEMENTATION ---
  deleteAccount: async (accountId: string) => {
    // Note: Deleting an account will also delete all its associated transactions
    // because of the "ON DELETE CASCADE" rule we set up in the database.
    const { error } = await supabase.from('accounts').delete().eq('id', accountId);
    if (error) {
      console.error("Error deleting account:", error);
    } else {
      // Refresh all data to ensure UI consistency
      await get().fetchData();
    }
  },
}));
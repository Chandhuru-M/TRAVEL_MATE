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
  // Correctly define the input type for addTransaction
  addTransaction: (details: {
    description: string;
    amount: number;
    type: 'expense' | 'income';
    account_id: string;
    trip_id: string | null;
    category: string;
  }) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  isLoaded: false,
  accounts: [],
  transactions: [],

  fetchData: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: accounts, error: accError } = await supabase.from('accounts').select('*');
    const { data: transactions, error: txError } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });

    if (accError || txError) {
      console.error("Error fetching finance data:", accError || txError);
    } else {
      // Cast the data to our strict types
      set({ accounts: accounts as Account[], transactions: transactions as Transaction[], isLoaded: true });
    }
  },

  createAccount: async (name, type, initialBalance) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert({ user_id: user.id, name, type, balance: initialBalance })
      .select()
      .single();
    
    if (newAccount) {
      set(state => ({ accounts: [newAccount as Account, ...state.accounts] }));
    } else {
      console.error("Error creating account:", error);
    }
  },

  addTransaction: async (details) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First, insert the new transaction
    const { error: txError } = await supabase.from('transactions').insert({ ...details, user_id: user.id });
    if (txError) {
      console.error("Error adding transaction:", txError);
      return; // Stop if transaction fails
    }

    // Then, find the account to update its balance
    const account = get().accounts.find(acc => acc.id === details.account_id);
    if (!account) {
      console.error("Account not found for transaction");
      return;
    }

    const newBalance = details.type === 'expense'
      ? account.balance - details.amount
      : account.balance + details.amount;

    // Finally, update the account's balance in the DB
    const { error: accError } = await supabase.from('accounts').update({ balance: newBalance }).eq('id', details.account_id);
    if (accError) {
      console.error("Error updating account balance:", accError);
      // In a real app, you might want to "rollback" or delete the transaction we just created
    } else {
      // Refresh all data from the DB to ensure perfect consistency
      await get().fetchData();
    }
  },
}));
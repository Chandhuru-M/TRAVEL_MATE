// src/services/walletService.ts
import { create } from 'zustand';
import { Transaction } from '@/lib/types';
import uuid from 'react-native-uuid';
import { supabase } from '@/lib/supabase';

// ... (Interfaces remain the same)
interface WalletState {
  isLoaded: boolean;
  isNewUserWallet: boolean;
  balance: number;
  transactions: Transaction[];
}
interface WalletActions {
  fetchWalletData: () => Promise<void>;
  initializeWallet: (initialBalance: number) => Promise<void>;
  addTransaction: (details: Omit<Transaction, 'id' | 'timestamp'>, deductFromBalance: boolean) => Promise<void>;
  setBalance: (newBalance: number) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  clearWalletData: () => void;
}

const _updateDb = async (newState: { balance: number; transactions: Transaction[] }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('wallets').update(newState).eq('user_id', user.id);
};

// --- THIS IS THE FIX ---
// Added the 'export' keyword.
export const useWalletStore = create<WalletState & WalletActions>()(
  (set, get) => ({
    isLoaded: false,
    isNewUserWallet: false,
    balance: 0,
    transactions: [],

    fetchWalletData: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('wallets').select('balance, transactions').eq('user_id', user.id).single();
      if (data) {
        set({ balance: data.balance, transactions: data.transactions, isLoaded: true, isNewUserWallet: false });
      } else if (error && error.code === 'PGRST116') {
        set({ isLoaded: true, isNewUserWallet: true, balance: 0, transactions: [] });
      }
    },

    initializeWallet: async (initialBalance) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: newWallet } = await supabase.from('wallets').upsert({ user_id: user.id, balance: initialBalance, transactions: [] }).select('balance, transactions').single();
      if (newWallet) {
        set({ balance: newWallet.balance, transactions: newWallet.transactions, isNewUserWallet: false });
      }
    },

    addTransaction: async (details, deductFromBalance) => {
      const currentState = get();
      if (currentState.isNewUserWallet) return;
      const newTransaction: Transaction = { ...details, id: uuid.v4() as string, timestamp: new Date().toISOString() };
      const newBalance = deductFromBalance ? currentState.balance - newTransaction.amount : currentState.balance;
      const newTransactions = [newTransaction, ...currentState.transactions];
      set({ balance: newBalance, transactions: newTransactions });
      await _updateDb({ balance: newBalance, transactions: newTransactions });
    },

    setBalance: async (newBalance) => {
      const currentState = get();
      if (currentState.isNewUserWallet) return;
      set({ balance: newBalance });
      await _updateDb({ balance: newBalance, transactions: currentState.transactions });
    },
    
    deleteTransaction: async (transactionId) => {
      const currentState = get();
      const newTransactions = currentState.transactions.filter((t) => t.id !== transactionId);
      set({ transactions: newTransactions });
      await _updateDb({ balance: currentState.balance, transactions: newTransactions });
    },

    clearWalletData: () => {
      set({ balance: 0, transactions: [], isLoaded: false, isNewUserWallet: false });
    },
  })
);
// src/services/walletService.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../lib/types';
import uuid from 'react-native-uuid';

interface WalletState {
  balance: number;
  transactions: Transaction[];
}

interface WalletActions {
  addTransaction: (details: Omit<Transaction, 'id' | 'timestamp'>, deductFromBalance: boolean) => void;
  deleteTransaction: (transactionId: string) => void;
  // --- THIS IS THE FIX ---
  // We must declare the function in the interface.
  setBalance: (newBalance: number) => void;
  // -----------------------
}

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      balance: 50000, // Starting with a mock balance
      transactions: [],

      addTransaction: (details, deductFromBalance) => {
        const newTransaction: Transaction = {
          ...details,
          id: uuid.v4() as string,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
          balance: deductFromBalance
            ? state.balance - newTransaction.amount
            : state.balance,
        }));
      },

      deleteTransaction: (transactionId) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== transactionId),
        }));
      },

      // The implementation was already correct.
      setBalance: (newBalance) => {
        set({ balance: newBalance });
      },
    }),
    {
      name: 'travelmate-wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
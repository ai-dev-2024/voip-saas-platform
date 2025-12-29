import { create } from 'zustand';
import api from '../services/api';

export const useWalletStore = create((set, get) => ({
    wallet: null,
    transactions: [],
    pagination: null,
    isLoading: false,
    error: null,

    fetchWallet: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/wallet');
            set({ wallet: response.data, error: null });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch wallet' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchTransactions: async (page = 1) => {
        set({ isLoading: true });
        try {
            const response = await api.get('/wallet/transactions', { params: { page } });
            set({
                transactions: response.data.transactions,
                pagination: response.data.pagination,
                error: null
            });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to fetch transactions' });
        } finally {
            set({ isLoading: false });
        }
    },

    createTopup: async (amount) => {
        try {
            const response = await api.post('/wallet/topup', { amount });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create checkout');
        }
    },

    updateBalance: (newBalance) => {
        set((state) => ({
            wallet: state.wallet ? { ...state.wallet, balance: newBalance } : null
        }));
    }
}));

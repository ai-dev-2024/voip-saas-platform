import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthStore extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const TOKEN_KEY = 'voip_access_token';
const USER_KEY = 'voip_user';

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, accessToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            set({
                user,
                accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (data) => {
        try {
            const response = await api.post('/auth/register', data);
            const { user, accessToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            set({
                user,
                accessToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Continue with logout
        }

        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        delete api.defaults.headers.common['Authorization'];

        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
        });
    },

    checkAuth: async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const userStr = await SecureStore.getItemAsync(USER_KEY);

            if (token && userStr) {
                const user = JSON.parse(userStr);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },
}));

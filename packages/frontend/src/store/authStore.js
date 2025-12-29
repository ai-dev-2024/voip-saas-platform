import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true, error: null });
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user, token } = response.data;
                    get().setAuth(user, token);
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user, token } = response.data;
                    get().setAuth(user, token);
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.message || 'Registration failed';
                    set({ error: message, isLoading: false });
                    return { success: false, error: message };
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            },

            fetchProfile: async () => {
                try {
                    const response = await api.get('/auth/me');
                    set({ user: response.data });
                } catch (error) {
                    if (error.response?.status === 401) {
                        get().logout();
                    }
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'voip-auth',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
        }
    )
);

// Initialize auth header on app load
const token = useAuthStore.getState().token;
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

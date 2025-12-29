import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import api from '@/services/api';

interface AuthStore extends AuthState {
    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
    updateUser: (user: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: true,

            // Login
            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<{ user: User; accessToken: string }>(
                        '/auth/login',
                        credentials
                    );
                    const { user, accessToken } = response.data;

                    set({
                        user,
                        accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Set token for future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Register
            register: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<{ user: User; accessToken: string }>(
                        '/auth/register',
                        data
                    );
                    const { user, accessToken } = response.data;

                    set({
                        user,
                        accessToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Logout
            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch {
                    // Continue with logout even if API fails
                }

                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                });

                delete api.defaults.headers.common['Authorization'];
            },

            // Refresh token
            refreshToken: async () => {
                try {
                    const response = await api.post<{ accessToken: string }>('/auth/refresh');
                    const { accessToken } = response.data;

                    set({ accessToken });
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                    return true;
                } catch {
                    // Token refresh failed, logout
                    get().logout();
                    return false;
                }
            },

            // Update user
            updateUser: (userData) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }));
            },

            // Set loading
            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            // Check auth on app load
            checkAuth: () => {
                const { accessToken } = get();
                if (accessToken) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    set({ isAuthenticated: true, isLoading: false });

                    // Verify token and get fresh user data
                    api.get<User>('/auth/me')
                        .then((response) => {
                            set({ user: response.data });
                        })
                        .catch(() => {
                            // Token invalid, try refresh
                            get().refreshToken();
                        });
                } else {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'voip-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                user: state.user,
            }),
        }
    )
);

export default useAuthStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'author' | 'admin';
  avatar?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token) =>
        set({ user, accessToken: token, isAuthenticated: true, isLoading: false }),

      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: !!get().user }),

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Logout error', error);
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuth: async () => {
        try {
          // If we don't have a token in state, we might still have a refresh cookie
          // We can call /auth/me or /auth/refresh to try to get a new session
          const { data } = await apiClient.post('/auth/refresh');
          
          if (data.success && data.data.accessToken) {
            set({ accessToken: data.data.accessToken });
            const userResponse = await apiClient.get('/auth/me');
            if (userResponse.data.success) {
              set({ 
                user: userResponse.data.data.user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return;
            }
          }
        } catch (error) {
          // Silent catch - user is not authenticated
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'wistoria-auth',
      partialize: (state) => ({ user: state.user }), // Only persist user data, tokens are handled via interceptors
    }
  )
);

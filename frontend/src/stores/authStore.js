import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      _hasHydrated: false,
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (userData, token, refreshToken) => set({ user: userData, token, refreshToken }),
      
      setToken: (token) => set({ token }),
      
      logout: () => {
        const state = useAuthStore.getState();
        // Invalidar refresh token en el backend
        if (state.refreshToken) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: state.refreshToken }),
          }).catch(() => {}); // No bloquear si falla
        }
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: 'pos-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

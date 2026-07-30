import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('erp_token'),
  user: JSON.parse(localStorage.getItem('erp_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    set({ token: null, user: null });
  }
}));

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; current_password?: string; password?: string; password_confirmation?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    const userJson = await AsyncStorage.getItem('auth_user');
    if (token && userJson) {
      set({ token, user: JSON.parse(userJson), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  register: async (name, email, password, password_confirmation) => {
    const { data } = await api.post('/register', { name, email, password, password_confirmation });
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    try { await api.post('/logout'); } catch {}
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    const { data: updatedUser } = await api.put('/me', data);
    await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

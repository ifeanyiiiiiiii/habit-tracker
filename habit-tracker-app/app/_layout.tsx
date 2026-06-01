import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import '../global.css';

export default function RootLayout() {
  const { user, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)/daily');
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

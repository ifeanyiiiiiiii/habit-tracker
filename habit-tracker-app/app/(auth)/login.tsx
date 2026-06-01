import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-white text-4xl font-bold mb-2">Welcome back 👋</Text>
        <Text className="text-muted text-base mb-10">Login to track your habits</Text>

        {error ? <Text className="text-red-400 mb-4 text-sm">{error}</Text> : null}

        <TextInput
          className="bg-surface text-white rounded-2xl px-4 py-4 mb-4 text-base"
          placeholder="Email"
          placeholderTextColor="#A0A0B0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="bg-surface text-white rounded-2xl px-4 py-4 mb-6 text-base"
          placeholder="Password"
          placeholderTextColor="#A0A0B0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Login</Text>
          }
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted">Don't have an account? </Text>
          <Link href="/(auth)/register">
            <Text className="text-primary font-semibold">Register</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

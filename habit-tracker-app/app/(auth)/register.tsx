import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, confirm);
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors as Record<string, string[]>)[0];
        setError(first[0]);
      } else {
        setError(e?.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <Text className="text-white text-4xl font-bold mb-2">Get started 🚀</Text>
        <Text className="text-muted text-base mb-10">Create your account</Text>

        {error ? <Text className="text-red-400 mb-4 text-sm">{error}</Text> : null}

        <TextInput
          className="bg-surface text-white rounded-2xl px-4 py-4 mb-4 text-base"
          placeholder="Full name"
          placeholderTextColor="#A0A0B0"
          value={name}
          onChangeText={setName}
        />
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
          className="bg-surface text-white rounded-2xl px-4 py-4 mb-4 text-base"
          placeholder="Password"
          placeholderTextColor="#A0A0B0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          className="bg-surface text-white rounded-2xl px-4 py-4 mb-6 text-base"
          placeholder="Confirm password"
          placeholderTextColor="#A0A0B0"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Create Account</Text>
          }
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 mb-8">
          <Text className="text-muted">Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text className="text-primary font-semibold">Login</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

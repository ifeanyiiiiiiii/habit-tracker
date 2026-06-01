import { View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

type EditMode = 'name' | 'email' | 'password' | null;

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [loggingOut, setLoggingOut] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);

  // Field state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const openEdit = (mode: EditMode) => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEditMode(mode);
  };

  const handleSave = async () => {
    if (editMode === 'name' && !name.trim()) { Alert.alert('Name cannot be empty'); return; }
    if (editMode === 'email' && !email.trim()) { Alert.alert('Email cannot be empty'); return; }
    if (editMode === 'password') {
      if (!currentPassword) { Alert.alert('Enter your current password'); return; }
      if (newPassword.length < 8) { Alert.alert('New password must be at least 8 characters'); return; }
      if (newPassword !== confirmPassword) { Alert.alert('Passwords do not match'); return; }
    }

    setSaving(true);
    try {
      if (editMode === 'name') await updateProfile({ name: name.trim() });
      else if (editMode === 'email') await updateProfile({ email: email.trim() });
      else if (editMode === 'password') await updateProfile({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword });
      setEditMode(null);
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors as Record<string, string[]>)[0];
        Alert.alert('Error', first[0]);
      } else {
        Alert.alert('Error', e?.response?.data?.message || 'Failed to update.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-5 pt-4">
        <Text className="text-white text-2xl font-bold mb-6">Profile</Text>

        {/* Avatar */}
        <View className="bg-surface rounded-2xl p-5 mb-4 items-center">
          <View className="w-20 h-20 rounded-full bg-primary/30 items-center justify-center mb-3">
            <Text className="text-primary text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-white text-lg font-semibold">{user?.name}</Text>
          <Text className="text-muted text-sm mt-1">{user?.email}</Text>
        </View>

        {/* Edit options */}
        <Text className="text-muted text-xs uppercase tracking-wider mb-2 ml-1">Account Details</Text>
        <View className="bg-surface rounded-2xl mb-4 overflow-hidden">
          <TouchableOpacity onPress={() => openEdit('name')} className="flex-row items-center justify-between px-4 py-4 border-b border-dark">
            <View>
              <Text className="text-muted text-xs mb-0.5">Name</Text>
              <Text className="text-white text-base">{user?.name}</Text>
            </View>
            <Text className="text-primary text-sm font-semibold">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openEdit('email')} className="flex-row items-center justify-between px-4 py-4 border-b border-dark">
            <View>
              <Text className="text-muted text-xs mb-0.5">Email</Text>
              <Text className="text-white text-base">{user?.email}</Text>
            </View>
            <Text className="text-primary text-sm font-semibold">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openEdit('password')} className="flex-row items-center justify-between px-4 py-4">
            <View>
              <Text className="text-muted text-xs mb-0.5">Password</Text>
              <Text className="text-white text-base">••••••••</Text>
            </View>
            <Text className="text-primary text-sm font-semibold">Change</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="bg-surface rounded-2xl p-4 flex-row items-center justify-between"
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Text className="text-secondary font-semibold text-base">Log out</Text>
          {loggingOut ? <ActivityIndicator size="small" color="#FF6584" /> : <Text className="text-secondary">→</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editMode !== null} transparent animationType="slide" onRequestClose={() => setEditMode(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setEditMode(null)} />
          <View style={{ backgroundColor: '#2A2A3E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
              {editMode === 'name' ? 'Edit Name' : editMode === 'email' ? 'Edit Email' : 'Change Password'}
            </Text>

            {editMode === 'name' && (
              <TextInput
                style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 15 }}
                placeholder="Full name"
                placeholderTextColor="#A0A0B0"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            )}

            {editMode === 'email' && (
              <TextInput
                style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 15 }}
                placeholder="Email address"
                placeholderTextColor="#A0A0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
            )}

            {editMode === 'password' && (
              <>
                <TextInput
                  style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
                  placeholder="Current password"
                  placeholderTextColor="#A0A0B0"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoFocus
                />
                <TextInput
                  style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
                  placeholder="New password (min. 8 characters)"
                  placeholderTextColor="#A0A0B0"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 15 }}
                  placeholder="Confirm new password"
                  placeholderTextColor="#A0A0B0"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditMode(null)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#A0A0B0', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

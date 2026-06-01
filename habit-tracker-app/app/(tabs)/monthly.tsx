import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { Habit } from '@/types';

const CACHE_KEY = 'cache_monthly_habits';

function daysLeftInMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate();
}

function completionPercent(habit: Habit) {
  if (!habit.total_logs || habit.total_logs === 0) return 0;
  return Math.round(((habit.completed_logs ?? 0) / habit.total_logs) * 100);
}

export default function MonthlyScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAction, setNewAction] = useState<'build' | 'break'>('build');
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAction, setEditAction] = useState<'build' | 'break'>('build');
  const [editSaving, setEditSaving] = useState(false);

  const fetchHabits = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data } = await api.get<Habit[]>('/habits');
      const monthly = data.filter((h) => h.type === 'monthly');
      setHabits(monthly);
      setOffline(false);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(monthly));
    } catch (e) {
      setOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then((cached) => {
      if (cached) {
        setHabits(JSON.parse(cached));
        setLoading(false);
        fetchHabits(true);
      } else {
        fetchHabits(false);
      }
    });
  }, []);

  const openModal = () => { setNewTitle(''); setNewCategory(''); setNewAction('build'); setModalVisible(true); };

  const createHabit = async () => {
    if (!newTitle.trim()) { Alert.alert('Title required'); return; }
    setSaving(true);
    try {
      await api.post('/habits', { title: newTitle.trim(), category: newCategory.trim() || undefined, type: 'monthly', action: newAction });
      setModalVisible(false);
      await fetchHabits();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create habit.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setEditCategory(habit.category || '');
    setEditAction(habit.action);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingHabit || !editTitle.trim()) { Alert.alert('Title required'); return; }
    setEditSaving(true);
    try {
      await api.put(`/habits/${editingHabit.id}`, { title: editTitle.trim(), category: editCategory.trim() || undefined, action: editAction });
      setEditModalVisible(false);
      await fetchHabits();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update habit.');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert('Delete Habit', `Delete "${habit.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/habits/${habit.id}`);
            await fetchHabits();
          } catch {
            Alert.alert('Error', 'Failed to delete habit.');
          }
        },
      },
    ]);
  };

  const showOptions = (habit: Habit) => {
    Alert.alert(habit.title, 'What would you like to do?', [
      { text: '✏️  Edit', onPress: () => openEditModal(habit) },
      { text: '🗑️  Delete', style: 'destructive', onPress: () => confirmDelete(habit) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) return (
    <View className="flex-1 bg-dark items-center justify-center">
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );

  const buildHabits = habits.filter((h) => h.action === 'build');
  const breakHabits = habits.filter((h) => h.action === 'break');
  const daysLeft = daysLeftInMonth();

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Monthly Habits</Text>
        {offline && (
          <View className="mt-2 bg-yellow-900/40 rounded-xl px-3 py-2">
            <Text className="text-yellow-400 text-xs">📶 Offline — showing cached data</Text>
          </View>
        )}
        <View className="mt-3 bg-surface rounded-2xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-xs">Days left this month</Text>
            <Text className="text-white text-2xl font-bold">{daysLeft}</Text>
          </View>
          <Text className="text-4xl">📅</Text>
        </View>
      </View>

      <FlatList
        data={[...buildHabits, ...breakHabits]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHabits(false); }} tintColor="#6C63FF" />}
        ListHeaderComponent={
          <>
            {buildHabits.length > 0 && <Text className="text-accent font-bold mb-3 text-sm uppercase tracking-wider">🌱 Building</Text>}
          </>
        }
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-muted text-center">No monthly habits yet.{'\n'}Tap + to add one.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const allItems = [...buildHabits, ...breakHabits];
          const showBreakHeader = item.action === 'break' && (index === 0 || allItems[index - 1]?.action !== 'break');
          const pct = completionPercent(item);
          return (
            <>
              {showBreakHeader && (
                <Text className="text-secondary font-bold mb-3 mt-4 text-sm uppercase tracking-wider">🚫 Breaking</Text>
              )}
              <View className="mb-3 bg-surface rounded-2xl p-4">
                <TouchableOpacity onLongPress={() => showOptions(item)} delayLongPress={400} activeOpacity={0.85}>
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-white font-semibold text-base flex-1 mr-2">{item.title}</Text>
                  <Text className={`text-xs font-bold px-2 py-1 rounded-xl ${item.action === 'build' ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
                    {item.action === 'build' ? 'Build' : 'Break'}
                  </Text>
                </View>
                {item.category && <Text className="text-muted text-xs mb-2">{item.category}</Text>}
                <View className="flex-row items-center">
                  <View className="flex-1 bg-dark rounded-full h-2 mr-3">
                    <View className={`h-2 rounded-full ${item.action === 'build' ? 'bg-accent' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
                  </View>
                  <Text className="text-muted text-xs">{pct}%</Text>
                </View>
                {(item.streak ?? 0) > 1 && (
                  <Text className="text-primary text-xs mt-2">🔥 {item.streak} day streak</Text>
                )}
                </TouchableOpacity>
              </View>
            </>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={openModal}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', elevation: 6 }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={{ backgroundColor: '#2A2A3E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>New Monthly Habit</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
              placeholder="Habit title *"
              placeholderTextColor="#A0A0B0"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15 }}
              placeholder="Category (optional)"
              placeholderTextColor="#A0A0B0"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <Text style={{ color: '#A0A0B0', fontSize: 13, marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={() => setNewAction('build')}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: newAction === 'build' ? '#43C59E' : '#1E1E2E' }}
              >
                <Text style={{ color: newAction === 'build' ? '#fff' : '#A0A0B0', fontWeight: 'bold' }}>🌱 Build</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewAction('break')}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: newAction === 'break' ? '#FF6584' : '#1E1E2E' }}
              >
                <Text style={{ color: newAction === 'break' ? '#fff' : '#A0A0B0', fontWeight: 'bold' }}>🚫 Break</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={createHabit}
              disabled={saving}
              style={{ backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Habit</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#A0A0B0', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setEditModalVisible(false)} />
          <View style={{ backgroundColor: '#2A2A3E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Edit Monthly Habit</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
              placeholder="Habit title *"
              placeholderTextColor="#A0A0B0"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15 }}
              placeholder="Category (optional)"
              placeholderTextColor="#A0A0B0"
              value={editCategory}
              onChangeText={setEditCategory}
            />
            <Text style={{ color: '#A0A0B0', fontSize: 13, marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditAction('build')}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: editAction === 'build' ? '#43C59E' : '#1E1E2E' }}
              >
                <Text style={{ color: editAction === 'build' ? '#fff' : '#A0A0B0', fontWeight: 'bold' }}>🌱 Build</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditAction('break')}
                style={{ flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: editAction === 'break' ? '#FF6584' : '#1E1E2E' }}
              >
                <Text style={{ color: editAction === 'break' ? '#fff' : '#A0A0B0', fontWeight: 'bold' }}>🚫 Break</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={saveEdit} disabled={editSaving} style={{ backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              {editSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#A0A0B0', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

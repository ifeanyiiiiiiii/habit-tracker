import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { Habit } from '@/types';

const CACHE_KEY = 'cache_daily_habits';
const today = new Date().toISOString().split('T')[0];

export default function DailyScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchHabits = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data } = await api.get<Habit[]>('/habits', { params: { type: 'daily' } });
      const daily = data.filter((h) => h.type === 'daily');
      setHabits(daily);
      setOffline(false);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(daily));
    } catch (e) {
      if (!background) setOffline(true);
      else setOffline(true);
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
        // Sync in background without blocking UI
        fetchHabits(true);
      } else {
        fetchHabits(false);
      }
    });
  }, []);

  const toggle = async (habit: Habit, isCompleted: boolean) => {
    setToggling(habit.id);
    try {
      if (isCompleted) {
        await api.post(`/habits/${habit.id}/uncheck`, { log_date: today });
      } else {
        await api.post(`/habits/${habit.id}/toggle`, { log_date: today });
      }
      await fetchHabits();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  const completedCount = habits.filter((h) => (h.completed_logs ?? 0) > 0).length;

  const openModal = () => { setNewTitle(''); setNewCategory(''); setModalVisible(true); };

  const createHabit = async () => {
    if (!newTitle.trim()) { Alert.alert('Title required'); return; }
    setSaving(true);
    try {
      await api.post('/habits', { title: newTitle.trim(), category: newCategory.trim() || undefined, type: 'daily', action: 'build' });
      setModalVisible(false);
      await fetchHabits();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create habit.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View className="flex-1 bg-dark items-center justify-center">
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Today's Habits</Text>
        <Text className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        {offline && (
          <View className="mt-2 bg-yellow-900/40 rounded-xl px-3 py-2">
            <Text className="text-yellow-400 text-xs">📶 Offline — showing cached data</Text>
          </View>
        )}
        <View className="mt-3 bg-surface rounded-2xl p-4 flex-row items-center justify-between">
          <Text className="text-white font-semibold">Completed today</Text>
          <Text className="text-accent text-lg font-bold">{completedCount}/{habits.length}</Text>
        </View>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHabits(false); }} tintColor="#6C63FF" />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-4xl mb-3">🌱</Text>
            <Text className="text-muted text-center">No daily habits yet.{'\n'}Tap + to add your first one.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCompleted = (item.completed_logs ?? 0) > 0;
          const isToggling = toggling === item.id;
          return (
            <TouchableOpacity
              onPress={() => toggle(item, isCompleted)}
              disabled={isToggling}
              className={`mb-3 rounded-2xl p-4 flex-row items-center ${isCompleted ? 'bg-accent/20 border border-accent/40' : 'bg-surface'}`}
            >
              <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${isCompleted ? 'bg-accent border-accent' : 'border-muted'}`}>
                {isCompleted && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-base ${isCompleted ? 'text-muted line-through' : 'text-white'}`}>{item.title}</Text>
                {item.category && <Text className="text-muted text-xs mt-0.5">{item.category}</Text>}
              </View>
              {(item.streak ?? 0) > 0 && (
                <View className="bg-primary/20 rounded-xl px-2 py-1">
                  <Text className="text-primary text-xs font-bold">🔥 {item.streak}</Text>
                </View>
              )}
              {isToggling && <ActivityIndicator size="small" color="#6C63FF" className="ml-2" />}
            </TouchableOpacity>
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
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>New Daily Habit</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
              placeholder="Habit title *"
              placeholderTextColor="#A0A0B0"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 15 }}
              placeholder="Category (optional, e.g. Health)"
              placeholderTextColor="#A0A0B0"
              value={newCategory}
              onChangeText={setNewCategory}
            />
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
    </SafeAreaView>
  );
}

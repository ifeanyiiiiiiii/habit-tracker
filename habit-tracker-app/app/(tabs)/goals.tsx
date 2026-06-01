import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { Goal } from '@/types';

const CACHE_KEY = 'cache_goals';

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function yearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchGoals = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data } = await api.get<Goal[]>('/goals');
      setGoals(data);
      setOffline(false);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
        setGoals(JSON.parse(cached));
        setLoading(false);
        fetchGoals(true);
      } else {
        fetchGoals(false);
      }
    });
  }, []);

  const openModal = () => {
    setNewTitle(''); setNewDescription(''); setNewTargetDate('');
    setNewMilestone(''); setMilestones([]); setModalVisible(true);
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setMilestones((prev) => [...prev, newMilestone.trim()]);
      setNewMilestone('');
    }
  };

  const removeMilestone = (i: number) => setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const createGoal = async () => {
    if (!newTitle.trim()) { Alert.alert('Title required'); return; }
    if (!newTargetDate.trim()) { Alert.alert('Target date required (YYYY-MM-DD)'); return; }
    setSaving(true);
    try {
      await api.post('/goals', {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        target_date: newTargetDate.trim(),
        milestones: milestones.map((m) => ({ title: m, done: false })),
      });
      setModalVisible(false);
      await fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create goal.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description || '');
    setEditTargetDate(goal.target_date);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editingGoal || !editTitle.trim()) { Alert.alert('Title required'); return; }
    if (!editTargetDate.trim()) { Alert.alert('Target date required (YYYY-MM-DD)'); return; }
    setEditSaving(true);
    try {
      await api.put(`/goals/${editingGoal.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        target_date: editTargetDate.trim(),
        milestones: editingGoal.milestones,
      });
      setEditModalVisible(false);
      await fetchGoals();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update goal.');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = (goal: Goal) => {
    Alert.alert('Delete Goal', `Delete "${goal.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/goals/${goal.id}`);
            await fetchGoals();
          } catch {
            Alert.alert('Error', 'Failed to delete goal.');
          }
        },
      },
    ]);
  };

  const showOptions = (goal: Goal) => {
    Alert.alert(goal.title, 'What would you like to do?', [
      { text: '✏️  Edit', onPress: () => openEditModal(goal) },
      { text: '🗑️  Delete', style: 'destructive', onPress: () => confirmDelete(goal) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleMilestone = async (goal: Goal, index: number) => {
    const updated = (goal.milestones ?? []).map((m, i) =>
      i === index ? { ...m, done: !m.done } : m,
    );
    try {
      await api.put(`/goals/${goal.id}`, { ...goal, milestones: updated });
      await fetchGoals();
    } catch {
      Alert.alert('Error', 'Failed to update milestone.');
    }
  };

  if (loading) return (
    <View className="flex-1 bg-dark items-center justify-center">
      <ActivityIndicator color="#6C63FF" size="large" />
    </View>
  );

  const yrPct = yearProgress();

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Yearly Goals</Text>
        {offline && (
          <View className="mt-2 bg-yellow-900/40 rounded-xl px-3 py-2">
            <Text className="text-yellow-400 text-xs">📶 Offline — showing cached data</Text>
          </View>
        )}
        <View className="mt-3 bg-surface rounded-2xl p-4">
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-muted text-xs">Calendar year progress</Text>
              <Text className="text-muted text-xs">{new Date().getFullYear()} · Jan → Dec</Text>
            </View>
            <Text className="text-white text-xs font-bold">{yrPct}%</Text>
          </View>
          <View className="bg-dark rounded-full h-2">
            <View className="h-2 rounded-full bg-primary" style={{ width: `${yrPct}%` }} />
          </View>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGoals(false); }} tintColor="#6C63FF" />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-4xl mb-3">🎯</Text>
            <Text className="text-muted text-center">No goals yet.{'\n'}Set your first yearly goal.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const days = daysUntil(item.target_date);
          const mList = item.milestones ?? [];
          const doneMilestones = mList.filter((m) => m.done).length;
          const pct = mList.length > 0 ? Math.round((doneMilestones / mList.length) * 100) : 0;

          return (
            <TouchableOpacity onLongPress={() => showOptions(item)} delayLongPress={400} activeOpacity={0.85}>
            <View className="mb-4 bg-surface rounded-2xl p-4">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-white font-semibold text-base flex-1 mr-2">{item.title}</Text>
                <View className={`px-2 py-1 rounded-xl ${item.status === 'completed' ? 'bg-accent/20' : item.status === 'abandoned' ? 'bg-red-900/30' : 'bg-primary/20'}`}>
                  <Text className={`text-xs font-bold ${item.status === 'completed' ? 'text-accent' : item.status === 'abandoned' ? 'text-red-400' : 'text-primary'}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              {item.description && <Text className="text-muted text-sm mb-3">{item.description}</Text>}

              {mList.length > 0 && (
                <>
                  <View className="flex-row items-center mb-2">
                    <View className="flex-1 bg-dark rounded-full h-2 mr-3">
                      <View className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </View>
                    <Text className="text-muted text-xs">{doneMilestones}/{mList.length}</Text>
                  </View>
                  {mList.map((m, i) => (
                    <TouchableOpacity key={i} onPress={() => toggleMilestone(item, i)} className="flex-row items-center mt-1">
                      <Text className={`text-xs mr-2 ${m.done ? 'text-accent' : 'text-muted'}`}>{m.done ? '✓' : '○'}</Text>
                      <Text className={`text-sm ${m.done ? 'text-muted line-through' : 'text-white'}`}>{m.title}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <View className="flex-row items-center mt-3 pt-3 border-t border-dark">
                <Text className={`text-xs font-semibold ${days <= 30 ? 'text-secondary' : 'text-muted'}`}>
                  ⏳ {days === 0 ? 'Due today!' : `${days} days left`}
                </Text>
              </View>
            </View>
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

      {/* Add Goal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={{ backgroundColor: '#2A2A3E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>New Yearly Goal</Text>
              <TextInput
                style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
                placeholder="Goal title *"
                placeholderTextColor="#A0A0B0"
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextInput
                style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
                placeholder="Description (optional)"
                placeholderTextColor="#A0A0B0"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />
              <TextInput
                style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15 }}
                placeholder="Target date * (YYYY-MM-DD)"
                placeholderTextColor="#A0A0B0"
                value={newTargetDate}
                onChangeText={setNewTargetDate}
              />

              <Text style={{ color: '#A0A0B0', fontSize: 13, marginBottom: 8 }}>Milestones</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15 }}
                  placeholder="Add milestone"
                  placeholderTextColor="#A0A0B0"
                  value={newMilestone}
                  onChangeText={setNewMilestone}
                  onSubmitEditing={addMilestone}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={addMilestone} style={{ backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>+</Text>
                </TouchableOpacity>
              </View>
              {milestones.map((m, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#A0A0B0', fontSize: 13, marginRight: 6 }}>○</Text>
                  <Text style={{ color: '#fff', flex: 1, fontSize: 14 }}>{m}</Text>
                  <TouchableOpacity onPress={() => removeMilestone(i)}>
                    <Text style={{ color: '#FF6584', fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={createGoal}
                disabled={saving}
                style={{ backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Goal</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12, alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#A0A0B0', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setEditModalVisible(false)} />
          <View style={{ backgroundColor: '#2A2A3E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Edit Goal</Text>
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
              placeholder="Goal title *"
              placeholderTextColor="#A0A0B0"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 }}
              placeholder="Description (optional)"
              placeholderTextColor="#A0A0B0"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <TextInput
              style={{ backgroundColor: '#1E1E2E', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 15 }}
              placeholder="Target date * (YYYY-MM-DD)"
              placeholderTextColor="#A0A0B0"
              value={editTargetDate}
              onChangeText={setEditTargetDate}
            />
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

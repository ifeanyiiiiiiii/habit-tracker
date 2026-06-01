import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ label, emoji }: { label: string; emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#2A2A3E', borderTopColor: '#3A3A5E', height: 64 },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#A0A0B0',
        tabBarLabelStyle: { fontSize: 11, marginBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="daily"
        options={{ title: 'Daily', tabBarIcon: () => <TabIcon emoji="✅" label="Daily" /> }}
      />
      <Tabs.Screen
        name="monthly"
        options={{ title: 'Monthly', tabBarIcon: () => <TabIcon emoji="📅" label="Monthly" /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Goals', tabBarIcon: () => <TabIcon emoji="🎯" label="Goals" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: () => <TabIcon emoji="👤" label="Profile" /> }}
      />
    </Tabs>
  );
}

import { View, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { router } from 'expo-router';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      {/* Background decorative blobs */}
      <View style={{ position: 'absolute', top: -100, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: '#6C63FF', opacity: 0.12 }} />
      <View style={{ position: 'absolute', top: height * 0.25, left: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: '#A78BFA', opacity: 0.08 }} />
      <View style={{ position: 'absolute', bottom: 220, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#6C63FF', opacity: 0.10 }} />
      <View style={{ position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#4F46E5', opacity: 0.18 }} />

      {/* Hero section */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* App icon */}
        <View style={{
          width: 110, height: 110, borderRadius: 32,
          backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center',
          marginBottom: 36, elevation: 16,
          shadowColor: '#6C63FF', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
        }}>
          <Text style={{ fontSize: 52 }}>🌱</Text>
        </View>

        <Text style={{ color: '#FFFFFF', fontSize: 46, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' }}>
          GrowX
        </Text>
        <Text style={{ color: '#6C63FF', fontSize: 13, fontWeight: '700', marginTop: 6, letterSpacing: 4, textTransform: 'uppercase' }}>
          Habit Tracker
        </Text>

        <Text style={{ color: '#A0A0B0', fontSize: 16, textAlign: 'center', marginTop: 20, lineHeight: 26, maxWidth: 270 }}>
          Build the habits that shape the life you want. One day at a time.
        </Text>

        {/* Feature pills */}
        <View style={{ flexDirection: 'row', marginTop: 48, gap: 16 }}>
          {[
            { emoji: '🔥', label: 'Streaks' },
            { emoji: '📅', label: 'Daily' },
            { emoji: '🎯', label: 'Goals' },
          ].map((item) => (
            <View key={item.label} style={{ alignItems: 'center' }}>
              <View style={{
                width: 58, height: 58, borderRadius: 18,
                backgroundColor: '#2A2A3E', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, borderWidth: 1, borderColor: '#3A3A5E',
              }}>
                <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              </View>
              <Text style={{ color: '#A0A0B0', fontSize: 12, fontWeight: '500' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA buttons */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 52 }}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{
            backgroundColor: '#6C63FF', borderRadius: 18, paddingVertical: 17,
            alignItems: 'center', marginBottom: 12, elevation: 8,
            shadowColor: '#6C63FF', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{
            backgroundColor: 'transparent', borderRadius: 18, paddingVertical: 17,
            alignItems: 'center', borderWidth: 1.5, borderColor: '#3A3A5E',
          }}
        >
          <Text style={{ color: '#A0A0B0', fontSize: 17, fontWeight: '600' }}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

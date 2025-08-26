// app/chat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { sendChatMobile, type Place as MobilePlace } from '@/services/mobileChatBot';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';

type Place = MobilePlace;
type ChatMsg = { role: 'assistant' | 'user'; content: string; places?: Place[] };

function haversine(lat1:number, lon1:number, lat2:number, lon2:number) {
  const toRad = (d:number)=> d*Math.PI/180
  const R = 6371
  const dLat = toRad(lat2-lat1)
  const dLon = toRad(lon2-lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R*c
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hello! I'm TravelMate AI. I can help find places, check weather, and plan trips. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`m-${Math.random().toString(36).slice(2, 10)}`);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const endRef = useRef<ScrollView>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const dynamicStyles = {
    container: { backgroundColor: colors.background[theme] },
    inputContainer: {
      borderTopColor: colors.border[theme],
      backgroundColor: colors.background[theme],
    },
    input: {
      backgroundColor: colors.card[theme],
      color: colors.text[theme],
      borderColor: colors.border[theme],
    },
    icon: {
      color: colors.textMuted[theme],
    },
  };

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setMessages((m) => [...m, { role: 'user', content }]);
    setInput('');
    setLoading(true);
    try {
  // Always use on-device mobile chat (no server/web integration)
  const res = await sendChatMobile({ message: content, location: userLocation, sessionId })
  setMessages((m) => [...m, { role: 'assistant', content: res.reply, places: (res as any).places }]);
      if (autoSpeak) {
        const text = res.reply.replace(/[📍🎯🌤️⛅☁️🌧️⛈️🌩️❄️🌫️💨🔥💧⭐🏨🍽️⛽🚗🗺️👋]/gu, '').trim();
        setSpeaking(true);
        Speech.speak(text, {
          rate: 0.9,
          onDone: () => setSpeaking(false),
          onStopped: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry, I hit a snag: ${e?.message || 'Unknown error'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (p: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text[theme] }]}>TravelMate AI</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted[theme] }]}>
            {userLocation ? '📍 Location enabled' : '📍 Getting location…'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => setAutoSpeak((v) => !v)} style={styles.topButton}>
            <Text style={{ color: autoSpeak ? '#16a34a' : colors.textMuted[theme] }}>🔊 {autoSpeak ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.messageContainer} ref={endRef}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user'
                ? styles.userBubble
                : [styles.assistantBubble, { backgroundColor: colors.card[theme] }],
            ]}
          >
            <Text style={msg.role === 'user' ? styles.userMessageText : [styles.assistantMessageText, { color: colors.text[theme] }]}>
              {msg.content}
            </Text>
            {msg.role === 'assistant' && msg.places && msg.places.length > 0 && (
              <View style={{ marginTop: 8, gap: 8 }}>
                {msg.places.slice(0, 3).map((p) => (
                  <TouchableOpacity key={p.id} style={styles.placeCard} onPress={() => openMaps(p)}>
                    <Text style={[styles.placeTitle, { color: colors.text[theme] }]}>{p.name}</Text>
                    <Text style={[styles.placeSubtitle, { color: colors.textMuted[theme] }]} numberOfLines={2}>{p.address}</Text>
                    <Text style={[styles.placeMeta, { color: colors.textMuted[theme] }]}>
                      {p.category || 'Place'}{p.rating ? ` • ⭐ ${p.rating}` : ''}{userLocation ? ` • ${(haversine(userLocation.lat, userLocation.lng, p.latitude, p.longitude)).toFixed(1)} km` : ''}
                    </Text>
                    <View style={styles.directionsRow}>
                      <FontAwesome name="map" size={16} color={colors.textMuted[theme]} />
                      <Text style={[styles.directionsText, { color: colors.textMuted[theme] }]}>Open in Maps</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={{ flexDirection:'row', gap:8 }}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#2563eb', flex:1 }]}
                    onPress={() => {
                      const p = msg.places![0];
                      router.push({ pathname: '/directions' as any, params: { lat: p.latitude, lng: p.longitude, name: p.name, ulat: userLocation?.lat ?? '', ulng: userLocation?.lng ?? '' } });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Quick Summary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#10b981', flex:1 }]}
                    onPress={() => {
                      const p = msg.places![0];
                      router.push({ pathname: '/live-navigation' as any, params: { lat: p.latitude, lng: p.longitude, name: p.name, profile: 'walking' } });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Start Live Nav</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, [styles.assistantBubble, { backgroundColor: colors.card[theme] }]]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator />
              <Text style={[styles.assistantMessageText, { color: colors.text[theme] }]}>TravelMate is thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textMuted[theme]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // Simple Android voice: open Google voice typing via intent is non-trivial here; keep as placeholder UI
              // Users can enable autoSpeak to hear responses.
              setListening((l) => !l);
            }}
          >
            <FontAwesome name="microphone" size={20} style={dynamicStyles.icon} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={onSend} disabled={!input.trim() || loading}>
          <FontAwesome name="send" size={20} style={dynamicStyles.icon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messageContainer: { flex: 1, padding: 16 },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  userMessageText: {
    color: 'white',
    fontSize: 16,
  },
  assistantMessageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 16,
    borderWidth: 1,
  },
  iconButton: {
    padding: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  topButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#eef2ff' },
  placeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  placeMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  directionsText: {
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontWeight: '600' },
});
// app/chat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Linking, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '@/utils/keyboardAware'
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { sendChatMobile } from '@/services/mobileChatBot';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { analyzeTextWithGemini, GeminiChatResponse } from '@/services/geminiService';
import { Place } from '@/lib/types';


type ChatMsg = { id: string; role: 'assistant' | 'user'; content: string; places?: Place[] };
const chatHistory: { messages: ChatMsg[]; input: string } = { messages: [], input: '' };

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMsg[]>(chatHistory.messages);
  const [input, setInput] = useState(chatHistory.input);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`m-${Math.random().toString(36).slice(2, 10)}`);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const endRef = useRef<any>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(56);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    setTimeout(() => {
      endRef.current?.scrollToEnd({ animated: true });
    }, 100);
    // Persist chat history in module variable
    chatHistory.messages = messages;
    chatHistory.input = input;
  }, [messages, loading, input]);

  // Auto-scroll when keyboard appears
  useEffect(() => {
    const showEvt = ((Platform.OS as string) === 'ios') ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = ((Platform.OS as string) === 'ios') ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt as any, (e: any) => {
      const h = e?.endCoordinates?.height || 0;
      setKeyboardHeight(h);
      setTimeout(() => endRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvt as any, () => {
      setKeyboardHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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

  // Render assistant text without markdown asterisks and with simple bullets
  const toPlain = (md: string) => {
    if (!md) return ''
    let s = md.replace(/\r\n/g, '\n')
    // Remove headings like ## Title
    s = s.replace(/^\s*#{1,6}\s+/gm, '')
    // Convert -/* bullets to •
    s = s.replace(/^(\s*)[-*]\s+/gm, '$1• ')
    // Bold/italic markers
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
    s = s.replace(/\*([^*]+)\*/g, '$1')
    // Backticks
    s = s.replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    // Extra asterisks leftovers
    s = s.replace(/\*{3,}/g, '')
    // Collapse blank lines
    s = s.replace(/\n{3,}/g, '\n\n')
    return s.trim()
  }

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    const userMsg: ChatMsg = { id: `${Date.now()}-user-${Math.random().toString(36).slice(2, 8)}`, role: 'user', content };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      endRef.current?.scrollToEnd({ animated: true });
    }, 100);
  // Note: No auto-navigation for pre-booking. We'll render a button under the user's message instead.

    // --- NEW: Detect if user is selecting a place by name or number after recommendations ---
    // Find the last assistant message with places
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.places && m.places.length > 0);
  if (lastAssistantMsg) {
      // Try to match by number (e.g., "2" or "2. Lotus Temple")
      const numMatch = content.match(/^(\d+)[\.\s-]*/);
      let selectedPlace = null;
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < (lastAssistantMsg.places?.length || 0)) {
          selectedPlace = lastAssistantMsg.places?.[idx] as any;
        }
      }
      // Try to match by name (case-insensitive substring)
      if (!selectedPlace) {
        selectedPlace = lastAssistantMsg.places?.find(
          p => p.name && p.name.toLowerCase().includes(content.toLowerCase())
        ) as any;
      }
      if (selectedPlace) {
        // Prefer opening Google Maps directions directly with live origin. If origin missing, fetch it now.
        const lat = (selectedPlace as any).latitude ?? (selectedPlace as any).lat ?? (selectedPlace as any).geocodes?.main?.lat;
        const lng = (selectedPlace as any).longitude ?? (selectedPlace as any).lng ?? (selectedPlace as any).geocodes?.main?.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          let originLat = userLocation?.lat;
          let originLng = userLocation?.lng;
          if (originLat == null || originLng == null) {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                originLat = loc.coords.latitude; originLng = loc.coords.longitude;
                setUserLocation({ lat: originLat, lng: originLng });
              }
            } catch {}
          }
          if (originLat != null && originLng != null) {
            const origin = encodeURIComponent(`${originLat},${originLng}`);
            const dest = encodeURIComponent(`${lat},${lng}`);
            const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
            Linking.openURL(url).catch(() => alert('Could not open Google Maps.'));
          } else {
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            Linking.openURL(url).catch(() => {});
          }
          setLoading(false);
          return;
        } else {
          // No coordinates: open Map View with fsq_id to resolve exact FSQ coordinates, include origin (fetch now if needed)
          let originLat = userLocation?.lat;
          let originLng = userLocation?.lng;
          if (originLat == null || originLng == null) {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                originLat = loc.coords.latitude; originLng = loc.coords.longitude;
                setUserLocation({ lat: originLat, lng: originLng });
              }
            } catch {}
          }
          router.push({ pathname: '/map-view' as any, params: { name: (selectedPlace as any).name || 'Destination', fsq_id: (selectedPlace as any).fsq_id || '', q: (selectedPlace as any).name || '', ulat: originLat ? String(originLat) : '', ulng: originLng ? String(originLng) : '' } });
          setLoading(false);
          return;
        }
      }
    }
    // --- END NEW ---

    try {
      const res = await analyzeTextWithGemini(content, userLocation);
      const assistantMsg: ChatMsg = { 
        id: `${Date.now()}-assistant-${Math.random().toString(36).slice(2, 8)}`, 
        role: 'assistant', 
        content: res.reply,
        places: res.places
      };
      setMessages((m) => [...m, assistantMsg]);
      if (autoSpeak) {
        const text = toPlain(res.reply).replace(/[📍🎯🌤️⛅☁️🌧️⛈️🌩️❄️🌫️💨🔥💧⭐🏨🍽️⛽🚗🗺️👋]/gu, '').trim();
        setSpeaking(true);
        Speech.speak(text, {
          rate: 0.9,
          onDone: () => setSpeaking(false),
          onStopped: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (e: any) {
      const errorMsg: ChatMsg = { id: `${Date.now()}-error-${Math.random().toString(36).slice(2, 8)}`, role: 'assistant', content: `Sorry, I hit a snag: ${e?.message || 'Unknown error'}` };
      setMessages((m) => [...m, errorMsg]);
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
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text[theme] }]}>TravelMate AI</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted[theme] }]}>
            {userLocation ? '📍 Location enabled' : '📍 Getting location…'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              setAutoSpeak((v) => {
                const newVal = !v;
                if (newVal) {
                  // Speak the last assistant message if available
                  const lastMsg = [...messages].reverse().find(m => m.role === 'assistant');
                  if (lastMsg) {
                    const text = toPlain(lastMsg.content).replace(/[📍🎯🌤️⛅☁️🌧️⛈️🌩️❄️🌫️💨🔥💧⭐🏨🍽️⛽🚗🗺️👋]/gu, '').trim();
                    setSpeaking(true);
                    Speech.speak(text, {
                      rate: 0.9,
                      onDone: () => setSpeaking(false),
                      onStopped: () => setSpeaking(false),
                      onError: () => setSpeaking(false),
                    });
                  }
                } else {
                  Speech.stop();
                  setSpeaking(false);
                }
                return newVal;
              });
            }}
            style={styles.topButton}
          >
            <Text style={{ color: autoSpeak ? '#16a34a' : colors.textMuted[theme] }}>🔊 {autoSpeak ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMessages([]);
              setInput('');
              chatHistory.messages = [];
              chatHistory.input = '';
            }}
            style={[styles.topButton, { marginLeft: 8, backgroundColor: '#f1f5f9' }]}
          >
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
  <KeyboardAwareScrollView
        style={styles.messageContainer}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 + inputBarHeight + (keyboardHeight > 0 ? keyboardHeight : Math.max(12, insets.bottom)) }}
        innerRef={endRef}
        enableOnAndroid
        enableAutomaticScroll
  extraScrollHeight={Math.max(24, inputBarHeight)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={(Platform.OS as string) === 'ios' ? 'interactive' : 'on-drag'}
      >
        {messages.map((msg, idx) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user'
                ? styles.userBubble
                : [styles.assistantBubble, { backgroundColor: colors.card[theme] }],
            ]}
          >
            <Text style={msg.role === 'user' ? styles.userMessageText : [styles.assistantMessageText, { color: colors.text[theme] }]}> 
              {msg.role === 'assistant' ? toPlain(msg.content) : msg.content}
            </Text>
            {msg.role === 'user' && /\b(pre\s*-?\s*book(ing)?|prebooking|pre\s*-?\s*booking)\b/i.test(msg.content) && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#0baff5ff', minHeight: 48, marginTop: 12 }]}
                onPress={() => router.push('/(tabs)/pre-booking')}
              >
                <Text style={styles.primaryButtonText}>Open now</Text>
              </TouchableOpacity>
            )}
            {/* Show Plan Trip button below user message if trip planning intent detected */}
            {msg.role === 'user' && /plan(\s|\w|\W)*trip|trip(\s|\w|\W)*plan|trip(\s|\w|\W)*planning/i.test(msg.content) && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#0baff5ff', minHeight: 50, marginTop: 15 }]}
                onPress={() => router.push('/(tabs)/trip-planner')}
              >
                <Text style={styles.primaryButtonText}>Go to Trip</Text>
              </TouchableOpacity>
            )}
            {msg.role === 'assistant' && msg.places && msg.places.length > 0 && (
              <View style={{ marginTop: 8, gap: 8 }}>
                {msg.places.slice(0, 3).map((p, idx) => (
                  <View key={p.fsq_id || p.id || `${p.latitude || p.geocodes?.main?.lat}-${p.longitude || p.geocodes?.main?.lng}-${p.name || idx}`} style={[styles.placeCard, { minHeight: 120, padding: 16, borderRadius: 16 }]}>
                    <Text style={[styles.placeTitle, { color: colors.text[theme], fontSize: 18, fontWeight: 'bold' }]}>{p.name}</Text>
                    <Text style={[styles.placeSubtitle, { color: colors.textMuted[theme], fontSize: 15 }]} numberOfLines={2}>{p.location?.formatted_address || p.address || ''}</Text>
                    <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 14 }]}> 
                      {p.category || (p.categories && p.categories.map((c:any)=>c.name).join(', ')) || 'Place'}{p.rating ? ` • ⭐ ${p.rating}` : ''}
                    </Text>
                    {typeof p.distance === 'number' ? (
                      <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 14 }]}>Distance: {p.distance} m</Text>
                    ) : userLocation && (p.latitude || p.geocodes?.main?.lat) && (p.longitude || p.geocodes?.main?.lng) ? (
                      <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 14 }]}>Distance: {haversine(userLocation.lat, userLocation.lng, p.latitude ?? p.geocodes?.main?.lat, p.longitude ?? p.geocodes?.main?.lng).toFixed(1)} km</Text>
                    ) : null}
                    <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 13, marginTop: 2 }]}>Details: {p.details || (p as any).description || 'No details available.'}</Text>
                    {/* extra fields */}
                    {(p.tel) ? <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 13 }]}>Phone: {p.tel}</Text> : null}
                    {p.website ? <Text style={[styles.placeMeta, { color: colors.primary[theme], fontSize: 13, textDecorationLine: 'underline' }]}>{p.website}</Text> : null}
                    {p.fsq_place_id ? <Text style={[styles.placeMeta, { color: colors.textMuted[theme], fontSize: 12 }]}>ID: {p.fsq_place_id}</Text> : null}
                    {p.link ? <Text style={[styles.placeMeta, { color: colors.primary[theme], fontSize: 13 }]} numberOfLines={1}>{p.link}</Text> : null}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#34a853', flex: 1, minHeight: 48 }]}
                        onPress={() => {
                          if (!userLocation) {
                            alert('User location not available');
                            return;
                          }
                          const lat = typeof p.latitude === 'number' ? p.latitude
                            : typeof p.lat === 'number' ? p.lat
                            : (typeof p.geocodes?.main?.lat === 'number' ? p.geocodes.main.lat : undefined);
                          const lng = typeof p.longitude === 'number' ? p.longitude
                            : typeof p.lng === 'number' ? p.lng
                            : (typeof p.geocodes?.main?.lng === 'number' ? p.geocodes.main.lng : undefined);
                          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                            const origin = encodeURIComponent(`${userLocation.lat},${userLocation.lng}`);
                            const dest = encodeURIComponent(`${lat},${lng}`);
                            const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
                            Linking.openURL(url).catch(() => alert('Could not open Google Maps.'));
                          } else {
                            router.push({ pathname: '/map-view' as any, params: { name: p.name || 'Destination', fsq_id: p.fsq_id || '', q: p.name || p.location?.formatted_address || '', ulat: String(userLocation?.lat || ''), ulng: String(userLocation?.lng || '') } });
                          }
                        }}
                      >
                        <FontAwesome name="map" size={18} color="white" />
                        <Text style={styles.primaryButtonText}>Google Directions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#10b981', flex: 1, minHeight: 48 }]}
                        onPress={() => {
                          const lat = p.latitude ?? p.lat ?? p.geocodes?.main?.lat;
                          const lng = p.longitude ?? p.lng ?? p.geocodes?.main?.lng;
                          const ulat = userLocation?.lat
                          const ulng = userLocation?.lng
                          if (typeof lat === 'number' && typeof lng === 'number') {
                            const placesPayload = (msg.places || []).slice(0, 10).map((pl, i) => ({ id: pl.fsq_id || pl.id || String(i), name: pl.name, lat: pl.latitude ?? pl.geocodes?.main?.lat, lng: pl.longitude ?? pl.geocodes?.main?.lng }))
                            router.push({ pathname: '/map-view' as any, params: { lat: String(lat), lng: String(lng), name: p.name || 'Destination', fsq_id: p.fsq_id || '', ulat: ulat ? String(ulat) : '', ulng: ulng ? String(ulng) : '', places: JSON.stringify(placesPayload) } });
                          } else {
                            const q = encodeURIComponent(p.name || p.location?.formatted_address || '');
                            const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
                            Linking.openURL(url).catch(() => {});
                          }
                        }}
                      >
                        <FontAwesome name="map" size={18} color="white" />
                        <Text style={styles.primaryButtonText}>View on Map</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={{ flexDirection:'row', gap:12, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#2563eb', flex:1, minHeight: 48 }]}
                    onPress={() => {
                      const p = msg.places![0];
                      const lat = p.latitude ?? p.geocodes?.main?.lat;
                      const lng = p.longitude ?? p.geocodes?.main?.lng;
                      if (!lat || !lng) {
                        alert('Place location not available');
                        return;
                      }
                      router.push({ pathname: '/directions' as any, params: { lat, lng, name: p.name, ulat: userLocation?.lat ?? '', ulng: userLocation?.lng ?? '' } });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Quick Summary</Text>
                  </TouchableOpacity>
                  {/* Trip Planner Button if trip planning intent detected */}
                  {msg.content && /plan(\s|\w|\W)*trip|trip(\s|\w|\W)*plan|trip(\s|\w|\W)*planning/i.test(msg.content) && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: '#5a42f5ff', flex:1, minHeight: 48 }]}
                      onPress={() => router.push('/(tabs)/trip-planner')}
                    >
                      <Text style={styles.primaryButtonText}>Plan Trip</Text>
                    </TouchableOpacity>
                  )}
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
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.inputContainer,
          dynamicStyles.inputContainer,
          { paddingBottom: Math.max(12, insets.bottom), bottom: keyboardHeight },
        ]}
        onLayout={(e) => setInputBarHeight(Math.ceil(e.nativeEvent.layout.height))}
      >
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textMuted[theme]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
          onFocus={() => setTimeout(() => endRef.current?.scrollToEnd({ animated: true }), 100)}
        />
  {(Platform.OS as string) === 'android' && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
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
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
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
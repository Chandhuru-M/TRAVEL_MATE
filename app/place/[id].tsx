// app/place/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { fetchPlaceDetails } from '@/lib/foursquare';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { useTripStore } from '@/services/tripService';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<any | null>(null);
  const params = useLocalSearchParams() as any;
  const { activeTripPlanId, savePlaceToTrip } = useTripStore();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setError(null);

      // If the caller passed the place object as a query param, use it to render immediately
      if (params?.place) {
        try {
          const decoded = decodeURIComponent(String(params.place));
          const parsed = JSON.parse(decoded);
          if (mounted) {
            setPlace(parsed);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn('[PlaceDetail] failed to parse place param, will fetch by id', e);
        }
      }

      // Otherwise, fetch details by fsq_id
      try {
        const data = await fetchPlaceDetails(String(id));
        if (!mounted) return;
        setPlace(data?.result || data);
      } catch (e: any) {
        console.error('Place details fetch error', e);
        setError(typeof e === 'string' ? e : e?.message || 'Failed to load details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false };
  }, [id]);


  // --- Button handlers (copied from PlaceCard) ---
  const handlePin = async () => {
    if (!place) return;
    try {
      const lat = place.latitude ?? place.location?.lat ?? place.location?.latitude ?? place.lat ?? null;
      const lon = place.longitude ?? place.location?.lon ?? place.location?.longitude ?? place.lon ?? null;

      let finalLat = lat;
      let finalLon = lon;

      // If no coords but we have a fsq_id, try fetching details from Foursquare
      if ((!finalLat || !finalLon) && place.fsq_id) {
        try {
          const details = await fetchPlaceDetails(place.fsq_id);
          const res = details?.result || details || {};
          finalLat = finalLat || res?.geocodes?.main?.latitude || res?.location?.latitude || finalLat;
          finalLon = finalLon || res?.geocodes?.main?.longitude || res?.location?.longitude || finalLon;
        } catch (e) {
          console.warn('fetchPlaceDetails failed', e);
        }
      }

      if (finalLat && finalLon) {
        const payload = encodeURIComponent(JSON.stringify({ latitude: finalLat, longitude: finalLon, name: place.name }));
        router.push(`/map?solo=${payload}` as any);
        return;
      }

      // Fallback: send address (SoloMapView will geocode it)
      const addr = place.location?.formatted_address || place.location?.address || place.name;
      if (!addr) { Alert.alert('Location unavailable', 'This place does not have coordinates or an address to navigate to.'); return; }
      const payload2 = encodeURIComponent(JSON.stringify({ address: addr, name: place.name }));
      router.push(`/map?solo=${payload2}` as any);
    } catch (e) {
      console.warn('pin navigation failed', e);
      Alert.alert('Unable to open map');
    }
  };

  const handleSave = async () => {
    if (!activeTripPlanId) {
      Alert.alert(
        "No Active Trip",
        "Please select an active trip from the Trip Planner tab before saving places.",
        [{ text: "OK", onPress: () => router.push('/(tabs)/trip-planner' as any) }]
      );
      return;
    }

    const result = await savePlaceToTrip(activeTripPlanId, place);
    if (result.success) {
      Alert.alert("Place Saved!", `"${place.name}" has been added to your active trip.`);
    } else {
      Alert.alert("Error", result.error || "Could not save the place.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background[theme] }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary[theme]} />
        ) : error ? (
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        ) : place ? (
          <>
            <Text style={[styles.title, { color: colors.text[theme] }]}>{place.name || place.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted[theme] }]}>{place.location?.formatted_address || place.location?.address || 'Address unavailable'}</Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text[theme] }]}>Categories</Text>
              <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]}>{(place.categories || []).map((c: any) => c.name).join(', ') || 'N/A'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textMuted[theme] }]}>Rating</Text>
                <Text style={[styles.statValue, { color: colors.text[theme] }]}>{place.rating ?? '—'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textMuted[theme] }]}>Price</Text>
                <Text style={[styles.statValue, { color: colors.text[theme] }]}>{place.price ? '$'.repeat(place.price) : '—'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textMuted[theme] }]}>Distance</Text>
                <Text style={[styles.statValue, { color: colors.text[theme] }]}>{typeof place.distance === 'number' ? `${place.distance} m` : '—'}</Text>
              </View>
            </View>

            {/* contact & extra fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text[theme] }]}>Contact</Text>
              {(place.tel || place.phone) ? <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]}>{place.tel ?? place.phone}</Text> : <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]}>Phone: N/A</Text>}
              {place.website ? (
                <TouchableOpacity onPress={() => Linking.openURL(place.website)}>
                  <Text style={[styles.sectionContent, { color: colors.primary[theme], textDecorationLine: 'underline' }]} numberOfLines={1}>{place.website}</Text>
                </TouchableOpacity>
              ) : null}
              {place.fsq_place_id ? <Text style={[styles.idText, { color: colors.textMuted[theme] }]}>FSQ ID: {place.fsq_place_id}</Text> : null}
              {place.link ? (
                <TouchableOpacity onPress={() => {
                  const l = place.link as string;
                  const url = l.startsWith('http') ? l : `https://foursquare.com${l}`;
                  Linking.canOpenURL(url).then(ok => ok && Linking.openURL(url)).catch(() => {});
                }}>
                  <Text style={[styles.sectionContent, { color: colors.primary[theme], textDecorationLine: 'underline' }]} numberOfLines={1}>{place.link}</Text>
                </TouchableOpacity>
              ) : null}
              {((place.latitude ?? place.location?.latitude ?? place.lat) || (place.longitude ?? place.location?.longitude ?? place.lon)) ? (
                <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]}>Coords: {place.latitude ?? place.location?.latitude ?? place.lat},{' '}{place.longitude ?? place.location?.longitude ?? place.lon}</Text>
              ) : null}
              {place.related_places ? <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]} numberOfLines={4}>Related: {typeof place.related_places === 'string' ? place.related_places : JSON.stringify(place.related_places)}</Text> : null}
              {place.social_media ? <Text style={[styles.sectionContent, { color: colors.textMuted[theme] }]} numberOfLines={4}>Social: {typeof place.social_media === 'string' ? place.social_media : JSON.stringify(place.social_media)}</Text> : null}
            </View>

          </>
        ) : (
          <Text style={[styles.errorText, { color: colors.textMuted[theme] }]}>No details available for this place.</Text>
        )}
      </ScrollView>
      {/* --- BOTTOM ACTION BUTTONS --- */}
      <View style={styles.bottomButtonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePin}>
          <Text style={styles.actionButtonText}>Get Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  subtitle: { fontSize: 16, marginTop: 6 },
  idText: { fontSize: 14, marginTop: 4, fontFamily: 'monospace' },

  errorText: { textAlign: 'center', marginTop: 20, fontSize: 16 },

  // photos removed from details page - keep layout compact

  section: { marginTop: 12, paddingVertical: 8, width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  sectionContent: { fontSize: 14, lineHeight: 20 },

  statsRow: { flexDirection: 'row', marginTop: 12, width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' },
  statBox: { minWidth: 96, flexBasis: '30%', padding: 8, borderRadius: 8, marginRight: 8, backgroundColor: 'transparent' },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 330, // move buttons up by about 15 inches
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'center',
  },
});
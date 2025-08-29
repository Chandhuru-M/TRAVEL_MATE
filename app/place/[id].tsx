// app/place/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchPlaceDetails } from '@/lib/foursquare';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<any | null>(null);
  // If the Home screen passed a serialized place via query params, use it.
  const params = useLocalSearchParams() as any;

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

          </>
        ) : (
          <Text style={[styles.errorText, { color: colors.textMuted[theme] }]}>No details available for this place.</Text>
        )}
      </ScrollView>
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
});
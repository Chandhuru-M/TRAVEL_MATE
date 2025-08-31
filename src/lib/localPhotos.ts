import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'trip_photos:';

const keyFor = (tripId: string) => `${KEY_PREFIX}${tripId}`;

export async function getLocalTripPhotos(tripId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(tripId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addLocalTripPhoto(tripId: string, uri: string): Promise<void> {
  const current = await getLocalTripPhotos(tripId);
  const next = [...current, uri];
  await AsyncStorage.setItem(keyFor(tripId), JSON.stringify(next));
}

export async function setLocalTripPhotos(tripId: string, uris: string[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(tripId), JSON.stringify(uris));
}

export async function removeLocalTripPhoto(tripId: string, uri: string): Promise<void> {
  try {
    const current = await getLocalTripPhotos(tripId);
    const next = current.filter(u => u !== uri);
    await AsyncStorage.setItem(keyFor(tripId), JSON.stringify(next));
  } catch {
    // no-op
  }
}

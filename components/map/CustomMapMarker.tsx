import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '../../constants';

// Define the types of markers we can have
type MarkerType = 'user' | 'friend' | 'crime' | 'poi';

interface CustomMapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: MarkerType;
  title: string;
  description?: string;
  initial?: string; // For friend's initial
}

const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({ coordinate, type, title, description, initial }) => {
  const renderMarkerStyle = () => {
    switch (type) {
      case 'user':
        return (
          <View style={[styles.markerBase, styles.userMarker]}>
            <View style={styles.userMarkerCore} />
          </View>
        );
      case 'friend':
        return (
          <View style={[styles.markerBase, styles.friendMarker]}>
            <Text style={styles.friendInitial}>{initial || 'F'}</Text>
          </View>
        );
      case 'crime':
        return (
          <View style={[styles.markerBase, styles.crimeMarker]}>
            <Ionicons name="warning" size={16} color={Colors.white} />
          </View>
        );
      case 'poi':
      default:
        return (
          <View style={[styles.markerBase, styles.poiMarker]}>
            <Ionicons name="location-sharp" size={18} color={Colors.white} />
          </View>
        );
    }
  };

  return (
    <Marker coordinate={coordinate} title={title} description={description}>
      {renderMarkerStyle()}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerBase: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    backgroundColor: Colors.primary,
  },
  userMarkerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  friendMarker: {
    backgroundColor: Colors.accent,
  },
  friendInitial: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  crimeMarker: {
    backgroundColor: Colors.danger,
  },
  poiMarker: {
    backgroundColor: Colors.textSecondary,
  },
});

export default CustomMapMarker;
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const HeroSection: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        console.log('No user id');
        setLoading(false);
        return;
      }
      console.log('Fetching profile for user id:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
        console.log('Fetched profile:', data); // Debug log
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user?.id]);

  const userName = loading
    ? ''
    : profile?.full_name
      ? profile.full_name
      : '';

  return (
    <View style={styles.container}>
      {/* Header with Greeting and Avatar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${user?.email}` }}
          style={styles.avatar}
        />
      </View>

      {/* AI Prompt Card */}
      <Link href="/chat" asChild>
        <TouchableOpacity style={styles.aiCard}>
          <Ionicons name="sparkles" size={32} color={Colors.light.accent} />
          <View style={styles.aiCardTextContainer}>
            <Text style={styles.aiCardTitle}>Talk to your AI Assistant</Text>
            <Text style={styles.aiCardSubtitle}>Plan trips, find places, and more</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={'rgba(255, 255, 255, 0.7)'} />
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: sizes.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.spacing.lg,
  },
  greeting: {
    fontSize: sizes.font.md,
    color: Colors.light.textSecondary,
  },
  userName: {
    fontSize: sizes.font.xxl,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  aiCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: sizes.borderRadius.lg,
    padding: sizes.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  aiCardTextContainer: {
    flex: 1,
    marginLeft: sizes.spacing.md,
  },
  aiCardTitle: {
    color: Colors.light.cardBackground,
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
  },
  aiCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: sizes.font.sm,
    marginTop: 2,
  },
});

export default HeroSection;
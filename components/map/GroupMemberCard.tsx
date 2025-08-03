import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface GroupMember {
  id: string;
  name: string;
  isOnline: boolean;
  avatarUrl?: string;
}

interface GroupMemberCardProps {
  member: GroupMember;
}

const GroupMemberCard: React.FC<GroupMemberCardProps> = ({ member }) => {
  return (
    <View style={styles.container}>
      <View>
        <Image
          source={{ uri: member.avatarUrl || `https://i.pravatar.cc/150?u=${member.id}` }}
          style={styles.avatar}
        />
        <View style={[styles.statusIndicator, { backgroundColor: member.isOnline ? Colors.success : Colors.textSecondary }]} />
      </View>
      <Text style={styles.name}>{member.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: sizes.spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    right: 10,
  },
  name: {
    fontSize: sizes.font.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default GroupMemberCard;
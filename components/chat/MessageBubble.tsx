import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, sizes } from '../../constants';

// Define the shape of a message object
interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: string | number;
    name?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isUser: boolean; // A simple prop to determine the sender
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="rocket" size={20} color={Colors.white} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={isUser ? styles.userText : styles.aiText}>{message.text}</Text>
        <Text style={[styles.timeText, isUser ? styles.userTime : styles.aiTime]}>
          {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: sizes.spacing.sm,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.sm,
    alignSelf: 'flex-end', // Aligns avatar to the bottom of the bubble
  },
  bubble: {
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    borderRadius: sizes.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: Colors.white,
    fontSize: sizes.font.md,
  },
  aiText: {
    color: Colors.textPrimary,
    fontSize: sizes.font.md,
  },
  timeText: {
    fontSize: 10,
    marginTop: sizes.spacing.xs,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  aiTime: {
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
  },
});

export default MessageBubble;
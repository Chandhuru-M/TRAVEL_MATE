// app/chat.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

// Mock messages to show the UI structure
const mockMessages = [
  { role: 'assistant', content: "Hi! I'm your AI travel assistant. How can I help you plan your trip today?" },
  { role: 'user', content: "Find me a good pizza place nearby." },
];

export default function ChatScreen() {
  const { theme } = useTheme();

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

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* Message Display Area */}
      <ScrollView style={styles.messageContainer}>
        {mockMessages.map((msg, index) => (
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
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textMuted[theme]}
        />
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesome name="microphone" size={20} style={dynamicStyles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
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
});
import { Colors, sizes } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---- DUMMY DATA (Replace with real state from your AI hook) ----
type Message = {
  _id: number;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name?: string;
  };
};

const INITIAL_MESSAGES: Message[] = [
  { _id: 1, text: "Hi! I'm your AI Travel Assistant. How can I help you today?", createdAt: new Date(), user: { _id: 2, name: 'TravelMate AI' } },
];

// ---- MAIN SCREEN COMPONENT ----

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const onSend = useCallback((newMessages: Message[] = []) => {
    setMessages(previousMessages => [...newMessages, ...previousMessages]);
  }, []);

  const handleSend = () => {
    if (input.trim().length === 0) return;

    const userMessage = {
      _id: Math.random(),
      text: input,
      createdAt: new Date(),
      user: { _id: 1 }, // User ID
    };

    onSend([userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        _id: Math.random(),
        text: `I'm processing your request about "${input}". This is a placeholder response.`,
        createdAt: new Date(),
        user: { _id: 2, name: 'TravelMate AI' },
      };
      onSend([aiResponse]);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    const isUser = item.user._id === 1;
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={isUser ? styles.userText : styles.aiText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Travel Assistant</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id.toString()}
          inverted // This makes the list start from the bottom
          contentContainerStyle={styles.messageList}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={Colors.light.textSecondary}
          />
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons name="mic-outline" size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="arrow-up" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---- STYLES ----

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  messageList: {
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: sizes.spacing.md,
    borderRadius: sizes.borderRadius.lg,
    marginBottom: sizes.spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.light.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: Colors.light.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F7F8FA',
    borderRadius: sizes.borderRadius.full,
    paddingHorizontal: sizes.spacing.md,
    marginRight: sizes.spacing.sm,
  },
  voiceButton: {
    padding: 10,
    marginRight: sizes.spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
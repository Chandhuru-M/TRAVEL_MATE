import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, sizes } from '../../constants';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStartVoice?: () => void; // Optional handler for voice input
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStartVoice }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length > 0) {
      onSendMessage(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask your travel assistant..."
          placeholderTextColor={Colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.iconButton} onPress={onStartVoice}>
          <Ionicons name="mic-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Ionicons name="arrow-up" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: Colors.white,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: sizes.borderRadius.full,
    paddingHorizontal: sizes.spacing.md,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: sizes.font.md,
    color: Colors.textPrimary,
    paddingVertical: sizes.spacing.sm, // Allows for multiline expansion
  },
  iconButton: {
    marginLeft: sizes.spacing.sm,
  },
  sendButton: {
    marginLeft: sizes.spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInput;
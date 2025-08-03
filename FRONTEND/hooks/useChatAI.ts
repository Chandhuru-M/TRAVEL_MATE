import { useState, useCallback } from 'react';
import axios from 'axios'; // Make sure to install axios: npm install axios

// Define the shape of a message for the chat state
interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: string | number; // 'user' for the human, 'ai' for the bot
  };
}

// Define the shape of the hook's return value
interface UseChatAIState {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
}

// The user object for the AI assistant
const AI_USER = { _id: 'ai' };

/**
 * A custom hook to manage the state and logic of an AI chat session.
 * @param initialMessages - An optional array of messages to start the chat with.
 */
export const useChatAI = (initialMessages: Message[] = []): UseChatAIState => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const sendMessage = useCallback(async (text: string) => {
    // 1. Create the user's message and add it to the state immediately
    const userMessage: Message = {
      _id: Math.random().toString(), // Use a more robust ID in a real app
      text,
      createdAt: new Date(),
      user: { _id: 'user' },
    };

    setMessages(previousMessages => [userMessage, ...previousMessages]);
    setIsTyping(true);

    // 2. Send the message to your backend API
    try {
      // IMPORTANT: Replace this URL with your actual backend endpoint
      const response = await axios.post('https://your-backend.com/api/chat', {
        message: text,
        // You might also send conversation history for context
        // history: messages,
      });

      const { reply } = response.data; // Assuming your API returns { reply: "..." }

      // 3. Create the AI's response message
      const aiMessage: Message = {
        _id: Math.random().toString(),
        text: reply,
        createdAt: new Date(),
        user: AI_USER,
      };

      // 4. Add the AI's message to the state
      setMessages(previousMessages => [aiMessage, ...previousMessages]);

    } catch (error) {
      console.error("Error fetching AI response:", error);
      // Create an error message to show in the chat
      const errorMessage: Message = {
        _id: Math.random().toString(),
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        createdAt: new Date(),
        user: AI_USER,
      };
      setMessages(previousMessages => [errorMessage, ...previousMessages]);
    } finally {
      setIsTyping(false);
    }
  }, []); // Add dependencies if your API call needs them (e.g., authToken)

  return { messages, isTyping, sendMessage };
};
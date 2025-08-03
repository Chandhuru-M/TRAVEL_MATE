import { useState, useEffect, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface VoiceState {
  isListening: boolean;
  results: string[];
  error?: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
}

/**
 * A custom hook to manage voice recognition using @react-native-voice/voice.
 * Make sure you have installed and configured the library.
 */
export const useVoiceRecognition = (): VoiceState => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    setResults(e.value || []);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    setError(e.error?.message);
  };

  const onSpeechStart = () => {
    setIsListening(true);
    setError(undefined);
    setResults([]);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  useEffect(() => {
    // Set up listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    // Cleanup listeners on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      await Voice.start('en-US'); // Start listening in US English
    } catch (e) {
      console.error('Error starting voice recognition:', e);
      setError((e as Error).message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
      setError((e as Error).message);
    }
  }, []);

  return {
    isListening,
    results,
    error,
    startListening,
    stopListening,
  };
};
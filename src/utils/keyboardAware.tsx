import React from 'react';
import { ScrollView } from 'react-native';

// Try to require the third-party KeyboardAwareScrollView, fallback to native ScrollView
let KeyboardAwareScrollView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  KeyboardAwareScrollView = require('react-native-keyboard-aware-scroll-view').KeyboardAwareScrollView;
} catch (e) {
  // fallback will be native ScrollView
  KeyboardAwareScrollView = ({ children, ...props }: any) => (
    <ScrollView {...props}>{children}</ScrollView>
  );
}

export default KeyboardAwareScrollView;

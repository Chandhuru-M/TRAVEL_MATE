import { useEffect, useState } from 'react'
import { Keyboard, Platform, KeyboardEvent } from 'react-native'

// Simple hook that tracks whether the keyboard is visible and returns boolean
export default function useKeyboardVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = (_e?: KeyboardEvent) => setVisible(true)
    const onHide = (_e?: KeyboardEvent) => setVisible(false)

    const subShow = Keyboard.addListener(showEvent, onShow)
    const subHide = Keyboard.addListener(hideEvent, onHide)

    return () => {
      try { subShow.remove() } catch {}
      try { subHide.remove() } catch {}
    }
  }, [])

  return visible
}

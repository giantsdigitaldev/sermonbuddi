// Safe wrapper for react-native-keyboard-controller
// Handles Expo Go compatibility by providing fallbacks

let keyboardController: any = null;

try {
  // Try to import the real keyboard controller
  keyboardController = require('react-native-keyboard-controller');
} catch (error) {
  // If it fails (like in Expo Go), provide a mock
  console.log('react-native-keyboard-controller not available, using fallback');
  keyboardController = {
    KeyboardController: {
      setForceTouchAvailable: () => {},
      setInputMode: () => {},
      setDefaultMode: () => {},
      dismiss: () => {},
      addListener: () => ({ remove: () => {} }),
    },
    KeyboardEvents: {
      addListener: () => ({ remove: () => {} }),
    },
    KeyboardGestureArea: ({ children }: { children: any }) => children,
    KeyboardAwareScrollView: ({ children }: { children: any }) => children,
    KeyboardAvoidingView: ({ children }: { children: any }) => children,
  };
}

export const KeyboardController = keyboardController.KeyboardController || keyboardController.default?.KeyboardController;
export const KeyboardEvents = keyboardController.KeyboardEvents || keyboardController.default?.KeyboardEvents;
export const KeyboardGestureArea = keyboardController.KeyboardGestureArea || keyboardController.default?.KeyboardGestureArea;
export const KeyboardAwareScrollView = keyboardController.KeyboardAwareScrollView || keyboardController.default?.KeyboardAwareScrollView;
export const KeyboardAvoidingView = keyboardController.KeyboardAvoidingView || keyboardController.default?.KeyboardAvoidingView;

export default keyboardController; 
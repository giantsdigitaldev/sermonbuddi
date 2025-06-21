// Simple mock for react-native-keyboard-controller
// This provides basic implementations to prevent errors in Expo Go

const noop = () => {};
const emptyListener = () => ({ remove: noop });

// Basic mock implementation
const mock = {
  KeyboardController: {
    setForceTouchAvailable: noop,
    setInputMode: noop,
    setDefaultMode: noop,
    dismiss: noop,
    addListener: emptyListener,
  },
  KeyboardEvents: {
    addListener: emptyListener,
  },
  // Simple pass-through components
  KeyboardGestureArea: ({ children }) => children,
  KeyboardAwareScrollView: ({ children }) => children,
  KeyboardAvoidingView: ({ children }) => children,
};

// Export for both CommonJS and ES6
module.exports = mock;
module.exports.default = mock;

// Support named exports
Object.keys(mock).forEach(key => {
  module.exports[key] = mock[key];
}); 
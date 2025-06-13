// Web polyfills for React Native compatibility
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Suppress useNativeDriver warnings on web
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('useNativeDriver')) {
      // Suppress useNativeDriver warnings on web
      return;
    }
    originalWarn.apply(console, args);
  };

  // Polyfill for global if it doesn't exist
  if (typeof global === 'undefined') {
    (window as any).global = window;
  }

  // Polyfill for process if it doesn't exist
  if (typeof process === 'undefined') {
    (window as any).process = {
      env: {},
      nextTick: (callback: () => void) => setTimeout(callback, 0),
    };
  }

  // Ensure Buffer is available if needed
  if (typeof Buffer === 'undefined') {
    try {
      const { Buffer } = require('buffer');
      (window as any).Buffer = Buffer;
    } catch (e) {
      // Buffer not available, that's okay
    }
  }

  // Polyfill for AsyncStorage on web to prevent import errors
  if (typeof window !== 'undefined') {
    // Create a mock AsyncStorage that uses localStorage
    const AsyncStorageMock = {
      getItem: async (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch (e) {
          // Ignore errors
        }
      },
      removeItem: async (key: string) => {
        try {
          window.localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      },
      clear: async () => {
        try {
          window.localStorage.clear();
        } catch (e) {
          // Ignore errors
        }
      },
      getAllKeys: async () => {
        try {
          return Object.keys(window.localStorage);
        } catch (e) {
          return [];
        }
      },
      multiGet: async (keys: string[]) => {
        try {
          return keys.map(key => [key, window.localStorage.getItem(key)]);
        } catch (e) {
          return keys.map(key => [key, null]);
        }
      },
      multiSet: async (keyValuePairs: [string, string][]) => {
        try {
          keyValuePairs.forEach(([key, value]) => {
            window.localStorage.setItem(key, value);
          });
        } catch (e) {
          // Ignore errors
        }
      },
      multiRemove: async (keys: string[]) => {
        try {
          keys.forEach(key => {
            window.localStorage.removeItem(key);
          });
        } catch (e) {
          // Ignore errors
        }
      },
    };

    // Override the AsyncStorage module resolution for web
    if (typeof require !== 'undefined') {
      try {
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        
        Module.prototype.require = function(id: string) {
          if (id === '@react-native-async-storage/async-storage') {
            return { default: AsyncStorageMock };
          }
          return originalRequire.apply(this, arguments);
        };
      } catch (e) {
        // Module patching not available, that's okay
      }
    }
  }
} 
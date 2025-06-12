import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

interface TabBarContextType {
  tabBarTranslateY: Animated.Value;
  showTabBar: () => void;
  hideTabBar: () => void;
  handleScroll: (...args: any[]) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const useTabBar = (): TabBarContextType => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};

interface TabBarProviderProps {
  children: React.ReactNode;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children }) => {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const showTabBar = () => {
    Animated.timing(tabBarTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTabBar = () => {
    Animated.timing(tabBarTranslateY, {
      toValue: 100, // Height of tab bar
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle scroll events for tab bar animation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: new Animated.Value(0) } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        
        // Show/hide tab bar based on scroll direction
        if (scrollDirection === 'down' && currentScrollY > 50) {
          // Scrolling down - hide tab bar
          Animated.timing(tabBarTranslateY, {
            toValue: 80,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (scrollDirection === 'up' || currentScrollY <= 50) {
          // Scrolling up or near top - show tab bar
          Animated.timing(tabBarTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const value: TabBarContextType = {
    tabBarTranslateY,
    showTabBar,
    hideTabBar,
    handleScroll,
  };

  return (
    <TabBarContext.Provider value={value}>
      {children}
    </TabBarContext.Provider>
  );
}; 
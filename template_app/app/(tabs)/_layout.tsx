import { ProtectedRoute } from "@/components/AuthGuard";
import { TabBarProvider } from "@/contexts/TabBarContext";
import { useTheme } from "@/theme/ThemeProvider";
import { AntDesign } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { Image, Platform, Text, View } from "react-native";
import { COLORS, FONTS, icons, SIZES } from "../../constants";

// Memoized tab icon component to prevent unnecessary re-renders
const TabIcon = React.memo(({ 
  focused, 
  activeIcon, 
  inactiveIcon, 
  label, 
  dark 
}: {
  focused: boolean;
  activeIcon: any;
  inactiveIcon: any;
  label: string;
  dark: boolean;
}) => {
  const iconStyle = useMemo(() => ({
    width: 24,
    height: 24,
    tintColor: focused ? COLORS.primary : (dark ? COLORS.gray3 : COLORS.gray3),
  }), [focused, dark]);

  const textStyle = useMemo(() => ({
    ...FONTS.body4,
    color: focused ? COLORS.primary : (dark ? COLORS.gray3 : COLORS.gray3),
  }), [focused, dark]);

  const containerStyle = useMemo(() => ({
    alignItems: "center" as const,
    paddingTop: 16,
    width: SIZES.width / 4
  }), []);

  return (
    <View style={containerStyle}>
      <Image
        source={focused ? activeIcon : inactiveIcon}
        resizeMode="contain"
        style={iconStyle}
      />
      <Text style={textStyle}>{label}</Text>
    </View>
  );
});

// Memoized floating action button
const FloatingActionButton = React.memo(() => {
  const buttonStyle = useMemo(() => ({
    height: 60,
    width: 60,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const
  }), []);

  return (
    <View style={buttonStyle}>
      <AntDesign name="plus" size={24} color={COLORS.white} />
    </View>
  );
});

const TabsContent = React.memo(() => {
  const { dark } = useTheme();
  // Navigation bar no longer hides on scroll - removed tabBarTranslateY

  // Create static tab bar style - no animation
  const tabBarStyle = useMemo(() => ({
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    left: 0,
    elevation: 0,
    height: Platform.OS === 'ios' ? 90 : 60,
    backgroundColor: dark ? COLORS.dark1 : COLORS.white,
    // Removed transform animation - tab bar stays visible
  }), [dark]);

  // Memoize screen options
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarHideOnKeyboard: Platform.OS !== 'ios',
    tabBarStyle,
  }), [tabBarStyle]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon={icons.home}
              inactiveIcon={icons.home2Outline}
              label="Home"
              dark={dark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon={icons.document2}
              inactiveIcon={icons.document2Outline}
              label="Projects"
              dark={dark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="addnewproject"
        options={{
          title: "",
          tabBarIcon: () => <FloatingActionButton />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon={icons.chat}
              inactiveIcon={icons.chatBubble2Outline}
              label="Inbox"
              dark={dark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon={icons.user}
              inactiveIcon={icons.userOutline}
              label="Profile"
              dark={dark}
            />
          ),
        }}
      />
    </Tabs>
  );
});

const TabLayout = React.memo(() => {
  return (
    <ProtectedRoute>
      <TabBarProvider>
        <TabsContent />
      </TabBarProvider>
    </ProtectedRoute>
  );
});

export default TabLayout;
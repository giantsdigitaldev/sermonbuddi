import { ProtectedRoute } from "@/components/AuthGuard";
import CustomTabBar from '@/components/CustomTabBar';
import { TabBarProvider } from "@/contexts/TabBarContext";
import { Tabs } from "expo-router";
import React from "react";

const TabLayout = React.memo(() => {
  return (
    <ProtectedRoute>
      <TabBarProvider>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="sermons" />
          <Tabs.Screen
            name="add"
            options={{
              tabBarButton: () => null, // We render a custom button in CustomTabBar
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                // This will be handled by the CustomTabBar
              },
            })}
          />
          <Tabs.Screen name="notifications" />
          <Tabs.Screen name="schedule" />
        </Tabs>
      </TabBarProvider>
    </ProtectedRoute>
  );
});

export default TabLayout;
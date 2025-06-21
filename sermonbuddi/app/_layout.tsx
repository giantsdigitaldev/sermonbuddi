import '@/utils/webPolyfills';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FONTS } from '@/constants/fonts';
import { AuthProvider } from '@/contexts/AuthContext';
import { TabBarProvider } from '@/contexts/TabBarContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider as ThemeProvider2 } from '@/theme/ThemeProvider';


// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Memoize critical screen options to prevent recreation
const screenOptions = {
  headerShown: false,
  animation: 'fade' as const,
  animationDuration: 200,
  contentStyle: { backgroundColor: 'transparent' },
  // Optimize memory usage
  freezeOnBlur: true,
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any critical assets here if needed
        // Could add critical route prefetching here
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for smoother loading
      } catch (e) {
        console.warn('Failed to prepare app', e);
      } finally {
        // Mark app as ready to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, appIsReady]);

  // Memoize the loading state check
  const isReady = useMemo(() => {
    return (fontsLoaded || fontError) && appIsReady;
  }, [fontsLoaded, fontError, appIsReady]);

  // Handle deep linking for email confirmation
  useEffect(() => {
    const handleURL = (event: { url: string }) => {
      const url = event.url;
      
      // 🚨 FIX: Only log and process specific deep links, not all URL changes
      // Ignore internal navigation and form state changes
      const isEmailConfirmation = url.includes('welcome-confirmed') || url.includes('confirm');
      const isExternalDeepLink = url.includes(':/') && !url.includes('localhost') && !url.includes('127.0.0.1');
      
      if (isEmailConfirmation || isExternalDeepLink) {
        console.log('🔗 External deep link received:', url);
        
        // Check if it's an email confirmation link
        if (isEmailConfirmation) {
          console.log('✉️ Email confirmation link detected, redirecting to welcome screen');
          router.push('/welcome-confirmed');
        }
      }
      // 🚨 NO LONGER LOG EVERY URL CHANGE to prevent spam during form interactions
    };

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', handleURL);

    // Check for initial URL when app starts
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 Initial URL:', url);
        handleURL({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ThemeProvider2>
              <TabBarProvider>
                <Stack screenOptions={screenOptions}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="welcome" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="signup" />
                  <Stack.Screen name="welcome-confirmed" />
                  <Stack.Screen name="fillyourprofile" />
                  <Stack.Screen name="forgotpasswordmethods" />
                  <Stack.Screen name="forgotpasswordemail" />
                  <Stack.Screen name="forgotpasswordphonenumber" />
                  <Stack.Screen name="otpverification" />
                  <Stack.Screen name="createnewpassword" />
                  <Stack.Screen name="createnewpin" />
                  <Stack.Screen name="enterpin" />
                  <Stack.Screen name="fingerprint" />
                  <Stack.Screen name="emailconfirmation" />
                  <Stack.Screen name="changeemail" />
                  <Stack.Screen name="changepassword" />
                  <Stack.Screen name="changepin" />
                  <Stack.Screen name="editprofile" />
                  <Stack.Screen name="paymentmethods" />
                  <Stack.Screen name="topupmethods" />
                  <Stack.Screen name="topupamount" />
                  <Stack.Screen name="topupconfirmpin" />
                  <Stack.Screen name="topupereceipt" />
                  <Stack.Screen name="ereceipt" />
                  <Stack.Screen name="menbership" />
                  <Stack.Screen name="projects" />
                  <Stack.Screen name="recentprojects" />
                  <Stack.Screen name="newproject" />
                  <Stack.Screen name="newprojectsetted" />
                  <Stack.Screen name="newprojectsetcolor" />
                  <Stack.Screen name="newprojectaddcover" />
                  <Stack.Screen name="projectdetails" />
                  <Stack.Screen name="projectdetailsboarddetails" />
                  <Stack.Screen name="projectdetailsaddteammenber" />
                  <Stack.Screen name="projectdetailsteammenber" />
                  <Stack.Screen name="newprojectboardtaskdetails" />
                  <Stack.Screen name="boarddetailssubtasks" />
                  <Stack.Screen name="taskdetails" />
                  <Stack.Screen name="todaytask" />
                  <Stack.Screen name="addnewtaskform" />
                  <Stack.Screen name="allcomments" />
                  <Stack.Screen name="search" />
                  <Stack.Screen name="inbox" />
                  <Stack.Screen name="inboxchatteammenber" />
                  <Stack.Screen name="inboxteamvoicecall" />
                  <Stack.Screen name="chat" />
                  <Stack.Screen name="chatsessions" />
                  <Stack.Screen name="call" />
                  <Stack.Screen name="videocall" />
                  <Stack.Screen name="upload" />
                  <Stack.Screen name="aiassistant" />
                  <Stack.Screen name="customerservice" />
                  <Stack.Screen name="settingsnotifications" />
                  <Stack.Screen name="settingssecurity" />
                  <Stack.Screen name="settingslanguage" />
                  <Stack.Screen name="settingsinvitefriends" />
                  <Stack.Screen name="settingshelpcenter" />
                  <Stack.Screen name="settingsprivacypolicy" />
                  <Stack.Screen name="settingspayment" />
                  <Stack.Screen name="acceptinvitation" />
                  <Stack.Screen name="address" />
                  <Stack.Screen name="addnewaddress" />
                  <Stack.Screen name="addnewcard" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="authtest" />
                  <Stack.Screen name="teamservicetest" />
                  <Stack.Screen name="demo" />
                  <Stack.Screen name="ui-library" />
                  <Stack.Screen name="dashboard/[projectId]" />
                  <Stack.Screen name="reviewsummary" />
                </Stack>
              </TabBarProvider>
            </ThemeProvider2>
          </ThemeProvider>
        </AuthProvider>
      </View>
    </GestureHandlerRootView>
  );
}
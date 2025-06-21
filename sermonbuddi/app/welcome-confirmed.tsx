import { router, useNavigation } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicOnlyRoute } from '../components/AuthGuard';
import Button from '../components/Button';
import Header from '../components/Header';
import { COLORS, illustrations } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

type Nav = {
    navigate: (value: string) => void;
}

const WelcomeConfirmed = () => {
    const { navigate } = useNavigation<Nav>();
    const { colors, dark } = useTheme();

    const handleGoToApp = () => {
        // Navigate to the main app tabs
        router.push('/(tabs)');
    };

    return (
        <PublicOnlyRoute>
            <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <Header title="" />
                    <View style={styles.center}>
                        <Image
                            source={illustrations.welcome}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        
                        <Text style={[styles.title, { 
                            color: dark ? COLORS.white : COLORS.greyscale900 
                        }]}>
                            Welcome to SermonBuddi!
                        </Text>
                        
                        <Text style={[styles.subtitle, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            Your email has been successfully verified!
                        </Text>
                        
                        <Text style={[styles.description, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            You can now start uploading sermons, generating social media content, and managing your church's online presence with SermonBuddi.
                        </Text>

                        <Button
                            title="Get Started"
                            filled
                            onPress={handleGoToApp}
                            style={styles.primaryButton}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </PublicOnlyRoute>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    illustration: {
        width: 250,
        height: 250,
        marginBottom: 40
    },
    title: {
        fontSize: 32,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        textAlign: 'center',
        marginBottom: 16
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'semiBold',
        color: COLORS.greyscale600,
        textAlign: 'center',
        marginBottom: 24
    },
    description: {
        fontSize: 16,
        fontFamily: 'regular',
        color: COLORS.greyscale600,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
        paddingHorizontal: 10
    },
    primaryButton: {
        width: '100%',
        borderRadius: 30
    }
});

export default WelcomeConfirmed; 
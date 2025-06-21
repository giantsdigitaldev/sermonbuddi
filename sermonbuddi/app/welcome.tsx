import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicOnlyRoute } from '../components/AuthGuard';
import Button from '../components/Button';
import Header from '../components/Header';
import { COLORS, illustrations } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Welcome = () => {
    const { colors, dark } = useTheme();

    const handleGetStarted = () => {
        router.push('/signup');
    };

    const handleSignIn = () => {
        router.push('/login');
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
                            Welcome to SermonBuddi
                        </Text>
                        
                        <Text style={[styles.subtitle, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            Transform your sermons into engaging social media content
                        </Text>
                        
                        <Text style={[styles.description, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            Upload your sermon documents and let AI generate daily social media posts for Twitter, Facebook, and Instagram. Schedule posts, track engagement, and grow your church's online presence.
                        </Text>

                        <View style={styles.featuresContainer}>
                            <View style={styles.feature}>
                                <Text style={[styles.featureText, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    📄 Upload sermon documents (5-50 pages)
                                </Text>
                            </View>
                            <View style={styles.feature}>
                                <Text style={[styles.featureText, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    🤖 AI generates 7 days of social media content
                                </Text>
                            </View>
                            <View style={styles.feature}>
                                <Text style={[styles.featureText, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    📅 Schedule and manage posts across platforms
                                </Text>
                            </View>
                            <View style={styles.feature}>
                                <Text style={[styles.featureText, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    📊 Track engagement and analytics
                                </Text>
                            </View>
                        </View>

                        <Button
                            title="Get Started"
                            filled
                            onPress={handleGetStarted}
                            style={styles.primaryButton}
                        />

                        <Button
                            title="Sign In"
                            filled={false}
                            onPress={handleSignIn}
                            style={styles.secondaryButton}
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
        marginBottom: 32,
        paddingHorizontal: 10
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 40
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    featureText: {
        fontSize: 14,
        fontFamily: 'regular',
        flex: 1
    },
    primaryButton: {
        width: '100%',
        borderRadius: 30,
        marginBottom: 12
    },
    secondaryButton: {
        width: '100%',
        borderRadius: 30
    }
});

export default Welcome;
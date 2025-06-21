import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicOnlyRoute } from '../components/AuthGuard';
import Button from '../components/Button';
import Header from '../components/Header';
import { COLORS, illustrations } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

type Nav = {
    navigate: (value: string) => void;
}

const EmailConfirmation = () => {
    const { navigate } = useNavigation<Nav>();
    const { colors, dark } = useTheme();
    const { signIn } = useAuth();
    const params = useLocalSearchParams();
    const [email, setEmail] = useState<string>('');
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        // Get email from navigation params or stored value
        if (params.email) {
            setEmail(params.email as string);
        }
    }, [params]);

    const handleResendEmail = async () => {
        if (!email) {
            Alert.alert('Error', 'Email address not found. Please go back and try signing up again.');
            return;
        }

        setIsResending(true);
        try {
            // Note: Supabase doesn't have a direct resend confirmation method
            // We would need to implement this through the auth API or guide user to signup again
            Alert.alert(
                'Resend Email',
                'If you haven\'t received the email, please check your spam folder or try signing up again.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            Alert.alert('Error', 'Failed to resend confirmation email.');
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToSignup = () => {
        navigate('signup');
    };

    const handleGoToLogin = () => {
        navigate('login');
    };

    return (
        <PublicOnlyRoute>
            <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <Header title="" />
                    <View style={styles.center}>
                        <Image
                            source={illustrations.checked}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                        
                        <Text style={[styles.title, { 
                            color: dark ? COLORS.white : COLORS.greyscale900 
                        }]}>
                            Check Your Email
                        </Text>
                        
                        <Text style={[styles.subtitle, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            We've sent a confirmation link to
                        </Text>
                        
                        <Text style={[styles.email, { 
                            color: COLORS.primary 
                        }]}>
                            {email || 'your email address'}
                        </Text>
                        
                        <Text style={[styles.description, { 
                            color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                        }]}>
                            Please check your email (including spam folder) and click the confirmation link to activate your account.
                        </Text>

                        <View style={styles.instructionContainer}>
                            <View style={styles.instructionStep}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepText}>1</Text>
                                </View>
                                <Text style={[styles.stepDescription, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    Open your email app
                                </Text>
                            </View>

                            <View style={styles.instructionStep}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepText}>2</Text>
                                </View>
                                <Text style={[styles.stepDescription, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    Find the email from CristOS
                                </Text>
                            </View>

                            <View style={styles.instructionStep}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepText}>3</Text>
                                </View>
                                <Text style={[styles.stepDescription, { 
                                    color: dark ? COLORS.white : COLORS.greyscale900 
                                }]}>
                                    Click "Confirm Email" button
                                </Text>
                            </View>
                        </View>

                        <Button
                            title="Go to Sign In"
                            filled
                            onPress={handleGoToLogin}
                            style={styles.primaryButton}
                        />

                        <TouchableOpacity 
                            onPress={handleResendEmail}
                            style={styles.resendButton}
                            disabled={isResending}
                        >
                            <Text style={[styles.resendText, { 
                                color: COLORS.primary,
                                opacity: isResending ? 0.5 : 1
                            }]}>
                                {isResending ? 'Sending...' : 'Didn\'t receive the email? Resend'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handleBackToSignup}
                            style={styles.backButton}
                        >
                            <Text style={[styles.backText, { 
                                color: dark ? COLORS.grayscale400 : COLORS.greyscale600 
                            }]}>
                                Back to Sign Up
                            </Text>
                        </TouchableOpacity>
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
        width: 200,
        height: 200,
        marginBottom: 32
    },
    title: {
        fontSize: 28,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        textAlign: 'center',
        marginBottom: 12
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'regular',
        color: COLORS.greyscale600,
        textAlign: 'center',
        marginBottom: 8
    },
    email: {
        fontSize: 16,
        fontFamily: 'semiBold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 24
    },
    description: {
        fontSize: 14,
        fontFamily: 'regular',
        color: COLORS.greyscale600,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32
    },
    instructionContainer: {
        width: '100%',
        marginBottom: 40
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    stepText: {
        fontSize: 14,
        fontFamily: 'semiBold',
        color: COLORS.white
    },
    stepDescription: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.greyscale900,
        flex: 1
    },
    primaryButton: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 30
    },
    resendButton: {
        marginBottom: 16,
        paddingVertical: 8
    },
    resendText: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.primary,
        textAlign: 'center'
    },
    backButton: {
        paddingVertical: 8
    },
    backText: {
        fontSize: 14,
        fontFamily: 'regular',
        color: COLORS.greyscale600,
        textAlign: 'center'
    }
});

export default EmailConfirmation; 
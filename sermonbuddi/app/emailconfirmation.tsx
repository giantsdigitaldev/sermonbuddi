import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicOnlyRoute } from '../components/AuthGuard';
import Button from '../components/Button';
import Header from '../components/Header';
import { COLORS, illustrations } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { AuthService } from '../utils/auth';

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

    const handleOpenInbox = async () => {
        try {
            // Try to open the default email app
            const emailDomain = email.split('@')[1];
            let emailUrl = '';
            
            // Common email providers
            if (emailDomain.includes('gmail')) {
                emailUrl = 'https://mail.google.com';
            } else if (emailDomain.includes('outlook') || emailDomain.includes('hotmail')) {
                emailUrl = 'https://outlook.live.com';
            } else if (emailDomain.includes('yahoo')) {
                emailUrl = 'https://mail.yahoo.com';
            } else if (emailDomain.includes('icloud')) {
                emailUrl = 'https://www.icloud.com/mail';
            } else {
                // Generic mailto link
                emailUrl = `mailto:${email}`;
            }
            
            const supported = await Linking.canOpenURL(emailUrl);
            if (supported) {
                await Linking.openURL(emailUrl);
            } else {
                // Fallback to mailto
                await Linking.openURL(`mailto:${email}`);
            }
        } catch (error) {
            console.error('Error opening inbox:', error);
            Alert.alert('Error', 'Could not open email app. Please check your email manually.');
        }
    };

    const handleResendEmail = async () => {
        if (!email) {
            Alert.alert('Error', 'Email address not found. Please go back and try signing up again.');
            return;
        }

        setIsResending(true);
        try {
            console.log('🔄 Resending confirmation email to:', email);
            const result = await AuthService.resendConfirmationEmail(email);
            
            if (result.success) {
                Alert.alert(
                    'Email Sent',
                    'Confirmation email has been resent. Please check your inbox (including spam folder).',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to resend confirmation email.');
            }
        } catch (error: any) {
            console.error('Resend email error:', error);
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
                            Please check your email (including spam folder) and click the confirmation link to activate your SermonBuddi account.
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
                                    Find the email from SermonBuddi
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
                            title="Open Inbox"
                            filled
                            onPress={handleOpenInbox}
                            style={styles.primaryButton}
                        />

                        <Button
                            title="Go to Sign In"
                            filled={false}
                            onPress={handleGoToLogin}
                            style={styles.secondaryButton}
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
        marginBottom: 16
    },
    description: {
        fontSize: 14,
        fontFamily: 'regular',
        color: COLORS.greyscale600,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
        paddingHorizontal: 10
    },
    instructionContainer: {
        width: '100%',
        marginBottom: 32
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    stepText: {
        color: COLORS.white,
        fontSize: 12,
        fontFamily: 'bold'
    },
    stepDescription: {
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
        borderRadius: 30,
        marginBottom: 16
    },
    resendButton: {
        paddingVertical: 8,
        marginBottom: 16
    },
    resendText: {
        fontSize: 14,
        fontFamily: 'regular',
        textAlign: 'center'
    },
    backButton: {
        paddingVertical: 8
    },
    backText: {
        fontSize: 14,
        fontFamily: 'regular',
        textAlign: 'center'
    }
});

export default EmailConfirmation; 
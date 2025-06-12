import Checkbox from 'expo-checkbox';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicOnlyRoute } from '../components/AuthGuard';
import Button from '../components/Button';
import Header from '../components/Header';
import Input from '../components/Input';
import OrSeparator from '../components/OrSeparator';
import SocialButton from '../components/SocialButton';
import { COLORS, SIZES, icons } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { validateInput } from '../utils/actions/formActions';
import { reducer } from '../utils/reducers/formReducers';

const isTestMode = true;

const initialState = {
    inputValues: {
        email: isTestMode ? 'test@example.com' : '',
        password: isTestMode ? 'password123' : '',
        fullName: isTestMode ? 'Test User' : '',
    },
    inputValidities: {
        email: false,
        password: false,
        fullName: false
    },
    formIsValid: false,
}

type Nav = {
    navigate: (value: string) => void
}

// Signup Screen
const Signup = () => {
    const { navigate } = useNavigation<Nav>();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChecked, setChecked] = useState(false);
    const { colors, dark } = useTheme();
    const { signUp } = useAuth();

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        },
        [dispatchFormState]);

    useEffect(() => {
        if (error) {
            Alert.alert('Signup Error', error, [
                { text: 'OK', onPress: () => setError(null) }
            ]);
        }
    }, [error]);

    const handleSignup = async () => {
        const { email, password, fullName } = formState.inputValues;
        
        if (!email || !password) {
            setError('Please fill in all required fields');
            return;
        }

        if (!formState.inputValidities.email) {
            setError('Please enter a valid email address');
            return;
        }

        if (!formState.inputValidities.password) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!isChecked) {
            setError('Please accept our Privacy Policy to continue');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await signUp(email, password, fullName);
            
            if (result.success) {
                Alert.alert(
                    'Registration Successful',
                    'Please check your email to verify your account before signing in.',
                    [
                        { 
                            text: 'OK', 
                            onPress: () => navigate('login')
                        }
                    ]
                );
            } else {
                setError(result.error || 'Registration failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Implementing apple authentication
    const appleAuthHandler = () => {
        Alert.alert('Coming Soon', 'Apple Sign In will be available soon');
    };

    // Implementing facebook authentication
    const facebookAuthHandler = () => {
        Alert.alert('Coming Soon', 'Facebook Sign In will be available soon');
    };

    // Implementing google authentication
    const googleAuthHandler = () => {
        Alert.alert('Coming Soon', 'Google Sign In will be available soon');
    };

    return (
        <PublicOnlyRoute>
            <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <Header title="" />
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>Create your</Text>
                            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>Account</Text>
                        </View>
                        <Input
                            id="fullName"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['fullName']}
                            placeholder="Full Name"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            icon={icons.profile}
                            autoCapitalize="words"
                            autoComplete="name"
                        />
                        <Input
                            id="email"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['email']}
                            placeholder="Email"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            icon={icons.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        <Input
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['password']}
                            autoCapitalize="none"
                            id="password"
                            placeholder="Password"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            icon={icons.padlock}
                            secureTextEntry={true}
                            autoComplete="password-new"
                        />
                        <View style={styles.checkBoxContainer}>
                            <View style={{ flexDirection: 'row' }}>
                                <Checkbox
                                    style={styles.checkbox}
                                    value={isChecked}
                                    color={isChecked ? COLORS.primary : dark ? COLORS.primary : "gray"}
                                    onValueChange={setChecked}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.privacy, {
                                        color: dark ? COLORS.white : COLORS.black
                                    }]}>By continuing you accept our Privacy Policy and Terms of Service</Text>
                                </View>
                            </View>
                        </View>
                        <Button
                            title={isLoading ? "Creating Account..." : "Sign Up"}
                            filled
                            onPress={handleSignup}
                            style={styles.button}
                            disabled={isLoading}
                        />
                        <View>
                            <OrSeparator text="or continue with" />
                            <View style={styles.socialBtnContainer}>
                                <SocialButton
                                    icon={icons.appleLogo}
                                    onPress={appleAuthHandler}
                                    tintColor={dark ? COLORS.white : COLORS.black}
                                />
                                <SocialButton
                                    icon={icons.facebook}
                                    onPress={facebookAuthHandler}
                                />
                                <SocialButton
                                    icon={icons.google}
                                    onPress={googleAuthHandler}
                                />
                            </View>
                        </View>
                    </ScrollView>
                    <View style={styles.bottomContainer}>
                        <Text style={[styles.bottomLeft, {
                            color: dark ? COLORS.white : COLORS.black
                        }]}>Already have an account ?</Text>
                        <TouchableOpacity
                            onPress={() => navigate("login")}>
                            <Text style={styles.bottomRight}>{" "}Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </PublicOnlyRoute>
    )
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
    logo: {
        width: 100,
        height: 100,
        tintColor: COLORS.primary
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 32
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    titleContainer: {
        marginVertical: 32
    },
    title: {
        fontSize: 48,
        fontFamily: "bold",
        color: "#212121",
    },
    checkBoxContainer: {
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 18,
    },
    checkbox: {
        marginRight: 8,
        height: 16,
        width: 16,
        borderRadius: 4,
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    privacy: {
        fontSize: 12,
        fontFamily: "regular",
        color: COLORS.black,
    },
    socialTitle: {
        fontSize: 19.25,
        fontFamily: "medium",
        color: COLORS.black,
        textAlign: "center",
        marginVertical: 26
    },
    socialBtnContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    bottomContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 18,
        position: "absolute",
        bottom: 12,
        right: 0,
        left: 0,
    },
    bottomLeft: {
        fontSize: 14,
        fontFamily: "regular",
        color: "black"
    },
    bottomRight: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.primary
    },
    button: {
        marginVertical: 6,
        width: SIZES.width - 32,
        borderRadius: 30
    }
})

export default Signup
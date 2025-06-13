import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { getFormatedDate } from "react-native-modern-datepicker";
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import DatePickerModal from '../components/DatePickerModal';
import Header from '../components/Header';
import Input from '../components/Input';
import { COLORS, FONTS, icons, images, SIZES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { validateInput } from '../utils/actions/formActions';
import { ProfileService } from '../utils/profileService';
import { reducer } from '../utils/reducers/formReducers';
import { StorageTest } from '../utils/storageTest';

interface CountryItem {
    flag: string;
    item: string;
    code: string;
    callingCode: string;
}

interface RenderItemProps {
    item: CountryItem;
}

// Static country data to avoid API dependency
const COUNTRIES_DATA: CountryItem[] = [
    { code: "US", item: "United States", callingCode: "+1", flag: "🇺🇸" },
    { code: "CA", item: "Canada", callingCode: "+1", flag: "🇨🇦" },
    { code: "GB", item: "United Kingdom", callingCode: "+44", flag: "🇬🇧" },
    { code: "AU", item: "Australia", callingCode: "+61", flag: "🇦🇺" },
    { code: "DE", item: "Germany", callingCode: "+49", flag: "🇩🇪" },
    { code: "FR", item: "France", callingCode: "+33", flag: "🇫🇷" },
    { code: "JP", item: "Japan", callingCode: "+81", flag: "🇯🇵" },
    { code: "KR", item: "South Korea", callingCode: "+82", flag: "🇰🇷" },
    { code: "CN", item: "China", callingCode: "+86", flag: "🇨🇳" },
    { code: "IN", item: "India", callingCode: "+91", flag: "🇮🇳" },
    { code: "BR", item: "Brazil", callingCode: "+55", flag: "🇧🇷" },
    { code: "MX", item: "Mexico", callingCode: "+52", flag: "🇲🇽" },
    { code: "ES", item: "Spain", callingCode: "+34", flag: "🇪🇸" },
    { code: "IT", item: "Italy", callingCode: "+39", flag: "🇮🇹" },
    { code: "NL", item: "Netherlands", callingCode: "+31", flag: "🇳🇱" },
];

const isTestMode = false;

const initialState = {
    inputValues: {
        fullName: '',
        email: '',
        nickname: '',
        phoneNumber: '',
        occupation: '',
    },
    inputValidities: {
        fullName: false,
        email: false,
        nickname: false,
        phoneNumber: false,
        occupation: false,
    },
    formIsValid: false,
}

// Edit Profile Screen
const EditProfile = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const { user } = useAuth();
    const [image, setImage] = useState<any>(null);
    const [error, setError] = useState();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [areas, setAreas] = useState<CountryItem[]>(COUNTRIES_DATA);
    const [selectedArea, setSelectedArea] = useState<CountryItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
    const [selectedGender, setSelectedGender] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const { dark } = useTheme();

    const genderOptions = [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
    ];

    const handleGenderChange = (value: any) => {
        setSelectedGender(value);
    };

    const today = new Date();
    const startDate = getFormatedDate(
        new Date(today.setDate(today.getDate() + 1)),
        "YYYY/MM/DD"
    );

    const [startedDate, setStartedDate] = useState("12/12/2023");
    const handleOnPressStartDate = () => {
        setOpenStartDatePicker(!openStartDatePicker);
    };

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        }, [dispatchFormState]);

    useEffect(() => {
        if (error) {
            Alert.alert('An error occured', error)
        }
    }, [error]);

    // Load user profile data
    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            
            try {
                // Test storage access on component load
                const storageTest = await StorageTest.testStorageAccess();
                if (!storageTest.success) {
                    console.warn('Storage access issue:', storageTest.error);
                    // Don't block the UI, just log the warning
                }
                
                const response = await ProfileService.getProfile();
                if (response.success && response.data) {
                    const profile = response.data;
                    setProfileData(profile);
                    
                    // Update form state with existing data from profile
                    dispatchFormState({
                        inputId: 'fullName',
                        validationResult: true,
                        inputValue: profile.full_name || user.user_metadata?.full_name || '',
                    });
                    
                    dispatchFormState({
                        inputId: 'email',
                        validationResult: true,
                        inputValue: user.email || '',
                    });
                    
                    dispatchFormState({
                        inputId: 'nickname',
                        validationResult: true,
                        inputValue: profile.username || '',
                    });
                    
                    // Load extended fields from user metadata
                    dispatchFormState({
                        inputId: 'occupation',
                        validationResult: true,
                        inputValue: user.user_metadata?.occupation || '',
                    });
                    
                    if (profile.avatar_url) {
                        setImage({ uri: profile.avatar_url });
                    }
                    
                    if (user.user_metadata?.gender) {
                        setSelectedGender(user.user_metadata.gender);
                    }
                    
                    if (user.user_metadata?.date_of_birth) {
                        setStartedDate(user.user_metadata.date_of_birth);
                    }
                    
                    if (user.user_metadata?.phone_number) {
                        dispatchFormState({
                            inputId: 'phoneNumber',
                            validationResult: true,
                            inputValue: user.user_metadata.phone_number,
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        loadProfile();
    }, [user]);

    useEffect(() => {
        // Set default country (US)
        const defaultCountry = COUNTRIES_DATA.find(country => country.code === "US");
        if (defaultCountry) {
            setSelectedArea(defaultCountry);
        }
    }, []);

    const pickImage = async () => {
        try {
            if (!user) {
                Alert.alert('Error', 'No user session found');
                return;
            }

            // Use ProfileService's image picker for web compatibility
            const result = await ProfileService.pickAndUploadProfileImage(user.id);
            
            if (result.success && result.url) {
                // Set the uploaded image URL
                setImage({ uri: result.url });
                Alert.alert('Success', 'Image uploaded successfully!');
            } else if (result.error && !result.error.includes('cancelled')) {
                console.error('Image upload failed:', result.error);
                Alert.alert('Upload Failed', result.error);
            }
        } catch (error: any) { 
            console.error('Error picking/uploading image:', error);
            Alert.alert('Error', 'Failed to pick or upload image');
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) {
            Alert.alert('Error', 'No user session found');
            return;
        }

        setLoading(true);
        try {
            // Validate profile data - only store basic fields in database
            const updateData = {
                full_name: formState.inputValues.fullName.trim(),
                username: formState.inputValues.nickname.trim(),
                website: '', // Can be added later if needed
                avatar_url: image?.uri || profileData?.avatar_url, // Include current image URL
                // Extended fields will be stored in user metadata
                phone_number: selectedArea ? 
                    `${selectedArea.callingCode}${formState.inputValues.phoneNumber}` : 
                    formState.inputValues.phoneNumber,
                occupation: formState.inputValues.occupation.trim(),
                gender: selectedGender,
                date_of_birth: startedDate,
            };

            // Validate the data
            const validation = ProfileService.validateProfileData(updateData);
            if (!validation.isValid) {
                Alert.alert('Validation Error', validation.errors.join('\n'));
                setLoading(false);
                return;
            }

            // Update profile using ProfileService
            const response = await ProfileService.updateProfile(
                updateData,
                undefined // Don't pass imageUri since image is already uploaded
            );
            
            if (response.success) {
                Alert.alert(
                    'Success', 
                    'Profile updated successfully!', 
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.error || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Render countries codes modal
    function RenderAreasCodesModal() {
        const renderItem = ({ item }: RenderItemProps) => {
            return (
                <TouchableOpacity
                    style={{
                        padding: 10,
                        flexDirection: "row",
                        alignItems: "center"
                    }}
                    onPress={() => {
                        setSelectedArea(item);
                        setModalVisible(false);
                    }}
                >
                    <Text style={{ fontSize: 24, marginRight: 10 }}>{item.flag}</Text>
                    <Text style={{ fontSize: 16, color: dark ? COLORS.white : COLORS.black, flex: 1 }}>
                        {item.item} ({item.callingCode})
                    </Text>
                </TouchableOpacity>
            )
        }

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}>
                <TouchableWithoutFeedback
                    onPress={() => setModalVisible(false)}>
                    <View
                        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View
                            style={{
                                height: 400,
                                width: SIZES.width * 0.8,
                                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                                borderRadius: 12
                            }}
                        >
                            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: dark ? COLORS.greyScale800 : COLORS.grayscale200 }}>
                                <Text style={{ fontSize: 18, fontFamily: 'semiBold', color: dark ? COLORS.white : COLORS.black, textAlign: 'center' }}>
                                    Select Country
                                </Text>
                            </View>
                            <FlatList
                                data={areas}
                                renderItem={renderItem}
                                horizontal={false}
                                keyExtractor={(item) => item.code}
                                style={{
                                    padding: 20,
                                    marginBottom: 20
                                }}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        )
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
                <Header title="Personal Profile" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ alignItems: "center", marginVertical: 12 }}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={image === null ? images.user1 : image}
                                resizeMode="cover"
                                style={styles.avatar} />
                            <TouchableOpacity
                                onPress={pickImage}
                                style={styles.pickImage}>
                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={24}
                                    color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View>
                        <Input
                            id="fullName"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['fullName']}
                            placeholder="Full Name"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            value={formState.inputValues.fullName}
                        />
                        <Input
                            id="nickname"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['nickname']}
                            placeholder="Username"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            value={formState.inputValues.nickname}
                        />
                        <Input
                            id="email"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['email']}
                            placeholder="Email"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            keyboardType="email-address"
                            value={formState.inputValues.email}
                            editable={false} // Email shouldn't be editable in profile
                            style={{ opacity: 0.7 }}
                        />
                        <View style={{
                            width: SIZES.width - 32
                        }}>
                            <TouchableOpacity
                                style={[styles.inputBtn, {
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                    borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                }]}
                                onPress={handleOnPressStartDate}
                            >
                                <Text style={{ ...FONTS.body4, color: COLORS.grayscale400 }}>{startedDate}</Text>
                                <Feather name="calendar" size={24} color={COLORS.grayscale400} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputContainer, {
                            backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                            borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                        }]}>
                            <TouchableOpacity
                                style={styles.selectFlagContainer}
                                onPress={() => setModalVisible(true)}>
                                <View style={{ justifyContent: "center" }}>
                                    <Image
                                        source={icons.arrowDown}
                                        resizeMode='contain'
                                        style={styles.downIcon}
                                    />
                                </View>
                                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                                    <Text style={{ fontSize: 20 }}>{selectedArea?.flag || "🇺🇸"}</Text>
                                </View>
                                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                                    <Text style={{ color: dark ? COLORS.white : "#111", fontSize: 12 }}>
                                        {selectedArea?.callingCode || "+1"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {/* Phone Number Text Input */}
                            <TextInput
                                style={[styles.input, { color: dark ? COLORS.white : "#111" }]}
                                placeholder="Enter your phone number"
                                placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                                selectionColor="#111"
                                keyboardType="numeric"
                                value={formState.inputValues.phoneNumber}
                                onChangeText={(text) => inputChangedHandler('phoneNumber', text)}
                            />
                        </View>
                        <View>
                            <RNPickerSelect
                                placeholder={{ label: 'Select Gender', value: '' }}
                                items={genderOptions}
                                onValueChange={(value) => handleGenderChange(value)}
                                value={selectedGender}
                                style={{
                                    inputIOS: {
                                        fontSize: 16,
                                        paddingHorizontal: 10,
                                        borderRadius: 4,
                                        color: dark ? COLORS.white : COLORS.greyscale600,
                                        paddingRight: 30,
                                        height: 52,
                                        width: SIZES.width - 32,
                                        alignItems: 'center',
                                        backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                    },
                                    inputAndroid: {
                                        fontSize: 16,
                                        paddingHorizontal: 10,
                                        borderRadius: 8,
                                        color: dark ? COLORS.white : COLORS.greyscale600,
                                        paddingRight: 30,
                                        height: 52,
                                        width: SIZES.width - 32,
                                        alignItems: 'center',
                                        backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                    },
                                }}
                            />
                        </View>
                        <Input
                            id="occupation"
                            onInputChanged={inputChangedHandler}
                            errorText={formState.inputValidities['occupation']}
                            placeholder="Occupation"
                            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                            value={formState.inputValues.occupation}
                        />
                    </View>
                </ScrollView>
            </View>
            <DatePickerModal
                open={openStartDatePicker}
                startDate={startDate}
                selectedDate={startedDate}
                onClose={() => setOpenStartDatePicker(false)}
                onChangeStartDate={(date) => setStartedDate(date)}
            />
            {RenderAreasCodesModal()}
            <View style={styles.bottomContainer}>
                <Button
                    title={loading ? "Updating..." : "Update Profile"}
                    filled
                    style={styles.continueButton}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
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
    avatarContainer: {
        marginVertical: 12,
        alignItems: "center",
        width: 130,
        height: 130,
        borderRadius: 65,
    },
    avatar: {
        height: 130,
        width: 130,
        borderRadius: 65,
    },
    pickImage: {
        height: 42,
        width: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    inputContainer: {
        flexDirection: "row",
        borderColor: COLORS.greyscale500,
        borderWidth: .4,
        borderRadius: 6,
        height: 52,
        width: SIZES.width - 32,
        alignItems: 'center',
        marginVertical: 16,
        backgroundColor: COLORS.greyscale500,
    },
    downIcon: {
        width: 10,
        height: 10,
        tintColor: "#111"
    },
    selectFlagContainer: {
        width: 90,
        height: 50,
        marginHorizontal: 5,
        flexDirection: "row",
    },
    flagIcon: {
        width: 30,
        height: 30
    },
    input: {
        flex: 1,
        marginVertical: 10,
        height: 40,
        fontSize: 14,
        color: "#111"
    },
    inputBtn: {
        borderWidth: 1,
        borderRadius: 12,
        borderColor: COLORS.greyscale500,
        height: 50,
        paddingLeft: 8,
        fontSize: 18,
        justifyContent: "space-between",
        marginTop: 4,
        backgroundColor: COLORS.greyscale500,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 8
    },
    rowContainer: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    bottomContainer: {
        position: "absolute",
        bottom: 32,
        right: 16,
        left: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        width: SIZES.width - 32,
        alignItems: "center"
    },
    continueButton: {
        width: SIZES.width - 32,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    genderContainer: {
        flexDirection: "row",
        borderColor: COLORS.greyscale500,
        borderWidth: .4,
        borderRadius: 6,
        height: 58,
        width: SIZES.width - 32,
        alignItems: 'center',
        marginVertical: 16,
        backgroundColor: COLORS.greyscale500,
    }
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingHorizontal: 10,
        color: COLORS.greyscale600,
        paddingRight: 30,
        height: 58,
        width: SIZES.width - 32,
        alignItems: 'center',
        backgroundColor: COLORS.greyscale500,
        borderRadius: 16
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        color: COLORS.greyscale600,
        paddingRight: 30,
        height: 58,
        width: SIZES.width - 32,
        alignItems: 'center',
        backgroundColor: COLORS.greyscale500,
        borderRadius: 16
    },
});

export default EditProfile
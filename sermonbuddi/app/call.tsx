import UserAvatar from '@/components/UserAvatar';
import { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

// Inbox call screen
const Call = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isMicrophoneOff, setIsMicrophoneOff] = useState(false);
    const { dark, colors } = useTheme();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerContainer}>
                    <Image
                        source={icons.arrowLeft}
                        resizeMode='contain'
                        style={[styles.arrowLeftIcon, {
                            tintColor: dark ? COLORS.white : COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <UserAvatar
                        size={200}
                        style={styles.userImg}
                    />
                    <View style={styles.view}>
                        <Text style={[styles.username, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>Jenny Wilona</Text>
                        <Text style={styles.usertime}>04:38 minutes</Text>
                    </View>
                </View>
                <View style={styles.bottomContainer}>
                    <TouchableOpacity>
                        <LinearGradient
                            // Background linear gradient
                            colors={['#ff7c8f', '#ff556e']}
                            style={styles.bottomBtn}>
                            <Image
                                source={icons.cancelSquare}
                                resizeMode='contain'
                                style={styles.bottomBtnIcon}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsCameraOff(!isCameraOff)}>
                        <LinearGradient
                            // Background Linear Gradient
                            colors={['#577cfe', '#3b64f8']}
                            style={styles.bottomBtn}>
                            <Image
                                source={isCameraOff ? icons.videoCamera2Off : icons.videoCamera}
                                resizeMode='contain'
                                style={styles.bottomBtnIcon} />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsMicrophoneOff(!isMicrophoneOff)}>
                        <LinearGradient
                            // Background Linear Gradient
                            colors={['#fea72f', '#fc980b']}
                            style={styles.bottomBtn}>
                            <Image
                                source={isMicrophoneOff ? icons.noSound : icons.mediumVolume}
                                resizeMode='contain'
                                style={styles.bottomBtnIcon} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: COLORS.white,
        padding: 16,
        alignItems: "center",
        justifyContent: "center"
    },
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 16
    },
    arrowLeftIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    userInfo: {
        alignItems: "center",
        marginBottom: 100
    },
    view: {
        marginVertical: 22,
        alignItems: 'center'
    },
    userImg: {
        width: 200,
        height: 200,
        borderRadius: 9999
    },
    username: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.black,
        marginBottom: 6
    },
    usertime: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.gray
    },
    bottomContainer: {
        position: "absolute",
        bottom: 36,
        width: SIZES.width - 32,
        alignItems: 'center',
        flexDirection: "row",
        justifyContent: "center"
    },
    bottomBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    bottomBtnIcon: {
        width: 32,
        height: 32,
        tintColor: COLORS.white
    }
})

export default Call
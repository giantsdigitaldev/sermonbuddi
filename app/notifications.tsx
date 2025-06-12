import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, icons } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { notifications } from '@/data';
import { Ionicons } from '@expo/vector-icons';

const Notifications = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    /**
    * Render header
    */
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}>
                        <Image
                            source={icons.back}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: dark ? COLORS.white : COLORS.black
                            }]} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Notification</Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.setting2Outline}
                        resizeMode='contain'
                        style={[styles.moreIcon, {
                            tintColor: dark ? COLORS.secondaryWhite : COLORS.black
                        }]}
                    />
                </TouchableOpacity>
            </View>
        )
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <>
                                {index === 0 || notifications[index - 1].date !== item.date ? (
                                    <Text style={[styles.dateHeader, {
                                        color: dark ? COLORS.white : COLORS.greyscale900,
                                    }]}>{item.date}</Text>
                                ) : null}
                                <View style={styles.notificationItem}>
                                    <Image source={item.avatar} style={styles.avatar} />
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.name, {
                                            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
                                        }]}>{item.name}</Text>
                                        <Text style={[styles.message, {
                                            color: dark ? COLORS.grayscale200 : "gray",
                                        }]}>{item.message} <Text style={[styles.app, {
                                            color: dark ? COLORS.grayscale200 : COLORS.greyscale900,
                                        }]}>{item.app}</Text></Text>
                                    </View>
                                    {item.type === "view" ? (
                                        <TouchableOpacity style={styles.viewButton}>
                                            <Text style={styles.viewText}>View</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.viewIcon}>
                                            <Ionicons name="paper-plane-outline" size={24} color="black" style={styles.icon} />
                                            <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="black" style={styles.icon} />
                                        </View>

                                    )}
                                </View>
                            </>
                        )}
                    />
                </ScrollView>
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
        padding: 16
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16
    },
    scrollView: {
        backgroundColor: COLORS.tertiaryWhite
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
        marginRight: 16
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.greyscale900
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    dateHeader: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginTop: 15,
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    textContainer: {
        flex: 1,
        marginLeft: 10,
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginBottom: 5,
    },
    message: {
        fontSize: 14,
        color: "gray",
        fontFamily: "regular"
    },
    app: {
        fontFamily: "bold",
        color: COLORS.greyscale900,
    },
    viewButton: {
        backgroundColor: "#007bff",
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    viewText: {
        color: "white",
        fontFamily: "semiBold",
        fontSize: 14,
    },
    icon: {
        marginLeft: 10,
    },
    viewIcon: {
        flexDirection: "row",
        alignItems: "center",
    },
});

export default Notifications
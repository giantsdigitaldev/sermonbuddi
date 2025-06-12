import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { usersData } from '@/data';
import { ScrollView } from 'react-native-virtualized-view';

const ProjectDetailsAddTeamMenber = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const [users, setUsers] = useState(usersData);
    const [search, setSearch] = useState("");

    const handleInvite = (id: string) => {
        setUsers(users.map(user => user.id === id ? { ...user, invited: !user.invited } : user));
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
    );
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
                    }]}>Add Team Menber</Text>
                </View>
                <View style={styles.viewRightContainer}>
                    <TouchableOpacity>
                        <Image
                            source={icons.moreCircle}
                            resizeMode='contain'
                            style={[styles.moreIcon, {
                                tintColor: dark ? COLORS.secondaryWhite : COLORS.black
                            }]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                {/* Search bar */}
                <View
                    style={[styles.searchBarContainer, {
                        backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite
                    }]}>
                    <TouchableOpacity>
                        <Image
                            source={icons.search2}
                            resizeMode='contain'
                            style={styles.searchIcon}
                        />
                    </TouchableOpacity>
                    <TextInput
                        placeholder='Search'
                        placeholderTextColor={COLORS.gray}
                        style={[styles.searchInput, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}
                        value={search}
                        onChangeText={setSearch}
                    />
                    <TouchableOpacity>
                        <Image
                            source={icons.filter}
                            resizeMode='contain'
                            style={styles.filterIcon}
                        />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={filteredUsers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.userContainer}>
                                <Image source={item.avatar} style={styles.avatar} />
                                <View style={styles.userInfo}>
                                    <Text style={[styles.name, {
                                        color: dark ? COLORS.white : COLORS.greyscale900,
                                    }]}>{item.name}</Text>
                                    <Text style={[styles.username, {
                                        color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                                    }]}>@{item.username}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.inviteButton, item.invited ? styles.invitedButton : styles.notInvitedButton]}
                                    onPress={() => handleInvite(item.id)}
                                >
                                    <Text style={[styles.inviteButtonText, item.invited && styles.invitedButtonText]}>
                                        {item.invited ? "Invited" : "Invite"}
                                    </Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
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
    starIcon: {
        width: 28,
        height: 28,
        marginRight: 12
    },
    viewRightContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    bottomContainer: {
        height: 64,
        width: "100%",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        bottom: 0,
        borderTopColor: COLORS.grayscale100,
        borderTopWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    addBtn: {
        width: SIZES.width - 32,
        height: 52,
        borderRadius: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        marginBottom: 16
    },
    addIcon: {
        height: 18,
        width: 18,
        tintColor: COLORS.white,
        marginRight: 8
    },
    addText: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.white
    },
    memberContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 999,
        marginRight: 10,
    },
    memberInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginBottom: 6
    },
    username: {
        fontSize: 14,
        color: COLORS.grayscale700,
        fontFamily: "medium"
    },
    icon: {
        marginLeft: 10,
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "blue",
        padding: 15,
        borderRadius: 10,
        justifyContent: "center",
        marginTop: 10,
    },
    addButtonText: {
        color: "white",
        fontSize: 16,
        marginLeft: 5,
    },
    searchBarContainer: {
        width: SIZES.width - 32,
        backgroundColor: COLORS.secondaryWhite,
        padding: 16,
        borderRadius: 12,
        height: 52,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center"
    },
    searchIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.gray
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: "regular",
        marginHorizontal: 8
    },
    filterIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary
    },
    userContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },
    userInfo: {
        flex: 1,
    },
    inviteButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    invitedButton: {
        backgroundColor: "transparent",
        borderColor: "#007bff",
    },
    notInvitedButton: {
        backgroundColor: "#007bff",
        borderColor: "#007bff",
    },
    inviteButtonText: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: "#fff",
    },
    invitedButtonText: {
        color: "#007bff",
    },
});

export default ProjectDetailsAddTeamMenber
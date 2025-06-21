import { View, Text, TouchableOpacity, Image, ImageSourcePropType, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { useTheme } from '@/theme/ThemeProvider';
import { COLORS, icons, SIZES } from '@/constants';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { recentprojects } from '@/data';
import ProjectCard from '@/components/ProjectCard';

const RecentProjects = () => {
    const { dark } = useTheme();
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
                            source={icons.back as ImageSourcePropType}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: dark ? COLORS.white : COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.greyscale900
                    }]}>
                        Recent Project
                    </Text>
                </View>
                <View style={styles.viewContainer}>
                    <TouchableOpacity>
                        <Image
                            source={icons.image2 as ImageSourcePropType}
                            resizeMode='contain'
                            style={styles.imageIcon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image
                            source={icons.file2 as ImageSourcePropType}
                            resizeMode='contain'
                            style={[styles.moreIcon, {
                                tintColor: dark ? COLORS.white : COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
            <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={recentprojects}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <ProjectCard
                                id={item.id}
                                name={item.name}
                                description={item.description}
                                image={item.image}
                                status={item.status}
                                numberOfTask={item.numberOfTask}
                                numberOfTaskCompleted={item.numberOfTaskCompleted}
                                numberOfDaysLeft={item.numberOfDaysLeft}
                                logo={item.logo}
                                members={item.menbers}
                                endDate={item.endDate}
                                customStyles={{
                                    card: {
                                        width: SIZES.width - 32
                                    }
                                }}
                                onPress={() => navigation.navigate("projectdetails")}
                            />
                        )}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

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
        width: SIZES.width - 32,
        justifyContent: "space-between",
        marginBottom: 16
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 16
    },
    viewContainer: {
        flexDirection: "row"
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    imageIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary,
        marginRight: 8
    }
})

export default RecentProjects
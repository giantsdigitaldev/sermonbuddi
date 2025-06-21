import TaskCard from '@/components/TaskCard';
import { COLORS, icons, SIZES } from '@/constants';
import { todayTasks } from '@/data';
import { useTheme } from '@/theme/ThemeProvider';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

const TodayTask = () => {
    const { dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

    const handleToggle = (id: string, completed: boolean) => {
        setCompletedTasks((prev) => ({ ...prev, [id]: completed }));
    };
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
                        Today&apos;s Task
                    </Text>
                </View>
                <View style={styles.viewContainer}>
                    <TouchableOpacity>
                        <Image
                            source={icons.moreCircle as ImageSourcePropType}
                            resizeMode='contain'
                            style={[styles.moreIcon, {
                                tintColor: dark ? COLORS.white : COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
            <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={todayTasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TaskCard task={item} isCompleted={!!completedTasks[item.id]} onToggle={handleToggle} />
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

export default TodayTask
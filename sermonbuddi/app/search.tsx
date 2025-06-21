import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, FlatList, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { ScrollView } from 'react-native-virtualized-view';
import ProjectCard from '@/components/ProjectCard';
import { allprojects, allTasks } from '@/data';
import TaskCard from '@/components/TaskCard';
import NotFoundCard from '@/components/NotFoundCard';

const Search = () => {
    const { dark, colors } = useTheme();
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
                        Search
                    </Text>
                </View>
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
        )
    }
    /**
     * render content
     */
    const renderContent = () => {
        const [selectedTab, setSelectedTab] = useState('Projects');
        const [searchQuery, setSearchQuery] = useState('');
        const [filteredProjects, setFilteredProjects] = useState<any>(allprojects);
        const [filteredTasks, setFilteredTasks] = useState(allTasks);
        const [resultsCount, setResultsCount] = useState(0);
        const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

        const handleToggle = (id: string, completed: boolean) => {
            setCompletedTasks((prev) => ({ ...prev, [id]: completed }));
        };

        useEffect(() => {
            handleSearch();
        }, [searchQuery, selectedTab]);

        const handleSearch = () => {
            if (selectedTab === 'Projects') {
                const projects = allprojects.filter((project) =>
                    project.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredProjects(projects);
                setResultsCount(projects.length);
            } else if (selectedTab === 'Tasks') {
                const tasks = allTasks.filter((task) =>
                    task.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredTasks(tasks);
                setResultsCount(tasks.length);
            }
        };

        return (
            <View>
                {/* Search Bar */}
                <View
                    style={[styles.searchBarContainer, {
                        backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite,
                        marginBottom: 12
                    }]}>
                    <TouchableOpacity
                        onPress={handleSearch}>
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
                        value={searchQuery}
                        onChangeText={(text) => setSearchQuery(text)}
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
                    {/* Tab bar container */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabBtn, selectedTab === 'Projects' && styles.selectedTab]}
                            onPress={() => {
                                setSelectedTab('Projects');
                                setSearchQuery(''); // Clear search query when changing tab
                            }}
                        >
                            <Text
                                style={[styles.tabBtnText, selectedTab === 'Projects' && styles.selectedTabText]}
                            >
                                Projects</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, selectedTab === 'Tasks' && styles.selectedTab]}
                            onPress={() => {
                                setSelectedTab('Tasks');
                                setSearchQuery(''); // Clear search query when changing tab
                            }}
                        >
                            <Text
                                style={[styles.tabBtnText, selectedTab === 'Tasks' && styles.selectedTabText]}
                            >Tasks</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results container  */}
                    <View style={{ backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }}>
                        {
                            searchQuery && (
                                <View style={styles.resultContainer}>
                                    <View style={styles.resultLeftView}>
                                        <Text style={[styles.subtitle, {
                                            color: dark ? COLORS.white : COLORS.greyscale900
                                        }]}>Results for "</Text>
                                        <Text style={[styles.subtitle, { color: COLORS.primary }]}>{searchQuery}</Text>
                                        <Text style={styles.subtitle}>"</Text>
                                    </View>
                                    <Text style={styles.subResult}>{resultsCount} found</Text>
                                </View>
                            )
                        }

                        {/* result list */}
                        <View style={{ marginVertical: 16 }}>
                            {resultsCount && resultsCount > 0 ? (
                                <FlatList
                                    data={selectedTab === 'Projects' ? filteredProjects : filteredTasks}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => {
                                        return selectedTab === 'Projects' ? (
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
                                        ) : (
                                            <TaskCard task={item} isCompleted={!!completedTasks[item.id]} onToggle={handleToggle} />
                                        );
                                    }}
                                />
                            ) : (
                                <NotFoundCard />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>

        )
    }
    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <View>
                    {renderContent()}
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
    },
    headerContainer: {
        flexDirection: "row",
        width: SIZES.width - 32,
        justifyContent: "space-between",
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 16,
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black,
    },
    searchBarContainer: {
        width: SIZES.width - 32,
        backgroundColor: COLORS.secondaryWhite,
        padding: 16,
        borderRadius: 12,
        height: 52,
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
    tabContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: SIZES.width - 32,
        justifyContent: "space-between"
    },
    tabBtn: {
        width: (SIZES.width - 32) / 2 - 6,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.4,
        borderColor: COLORS.primary,
        borderRadius: 32
    },
    selectedTab: {
        width: (SIZES.width - 32) / 2 - 6,
        height: 42,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.4,
        borderColor: COLORS.primary,
        borderRadius: 32
    },
    tabBtnText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.primary,
        textAlign: "center"
    },
    selectedTabText: {
        fontSize: 16,
        fontFamily: "semiBold",
        color: COLORS.white,
        textAlign: "center"
    },
    resultContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: SIZES.width - 32,
        marginVertical: 16,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.black,
    },
    subResult: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.primary
    },
    resultLeftView: {
        flexDirection: "row"
    },
})
export default Search
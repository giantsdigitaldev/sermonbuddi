import ProjectCard from '@/components/ProjectCard';
import SubHeaderItem from '@/components/SubHeaderItem';
import TaskCard from '@/components/TaskCard';
import { COLORS, icons, images, SIZES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTabBar } from '@/contexts/TabBarContext';
import { recentprojects, todayTasks } from '@/data';
import { useTheme } from '@/theme/ThemeProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const { dark, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAuth();
  const { handleScroll } = useTabBar();

  // Get user display name and greeting
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning👋';
    if (hour < 17) return 'Good Afternoon👋';
    return 'Good Evening👋';
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.viewLeft}>
          <Image
            source={images.user1}
            resizeMode="contain"
            style={styles.userIcon}
          />
          <View style={styles.viewNameContainer}>
            <Text style={styles.greeeting}>{getGreeting()}</Text>
            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {getUserDisplayName()}
            </Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          <TouchableOpacity onPress={() => navigation.navigate('notifications')}>
            <Image
              source={icons.notificationBell2}
              resizeMode="contain"
              style={[styles.bellIcon, { tintColor: dark ? COLORS.white : COLORS.greyscale900 }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchBar = () => {
    const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setHasNavigated(false); // Reset when returning to the screen
    });

    return unsubscribe;
  }, [navigation]);

  const handleInputFocus = () => {
    if (!hasNavigated) {
      setHasNavigated(true);
      navigation.navigate('search');
    }
  };

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('search')}
        style={[styles.searchBarContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite }]}>
        <TouchableOpacity>
          <Image
            source={icons.search2}
            resizeMode="contain"
            style={styles.searchIcon}
          />
        </TouchableOpacity>
        <TextInput
          placeholder="Search"
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
          onFocus={handleInputFocus}
        />
        <TouchableOpacity>
          <Image
            source={icons.filter}
            resizeMode="contain"
            style={styles.filterIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  /**
   * render recent project
   */
  const renderRecentProject = () => {
    return (
      <View style={{ backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }}>
        <SubHeaderItem
          title="Recent Project"
          navTitle="See All"
          onPress={() => navigation.navigate("recentprojects")}
        />
        <FlatList
          data={recentprojects}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
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
              onPress={() => navigation.navigate("projectdetails")}
            />
          )}
        />
      </View>
    )
  }
  /**
   * render today task
   */
  const renderTodayTask = () => {
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

    const handleToggle = (id: string, completed: boolean) => {
      setCompletedTasks((prev) => ({ ...prev, [id]: completed }));
    };

    return (
      <View style={{ backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }}>
        <SubHeaderItem
          title="Today Task"
          navTitle="See All"
          onPress={() => navigation.navigate("todaytask")}
        />
        <FlatList
          data={todayTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} isCompleted={!!completedTasks[item.id]} onToggle={handleToggle} />
          )}
        />
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 100 }} // Add padding for tab bar
        >
          {renderSearchBar()}
          {renderRecentProject()}
          {renderTodayTask()}
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.tertiaryWhite,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.tertiaryWhite,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    width: SIZES.width - 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 32,
  },
  viewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeeting: {
    fontSize: 12,
    fontFamily: 'regular',
    color: 'gray',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
  },
  viewNameContainer: {
    marginLeft: 12,
  },
  viewRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 8,
  },
  bookmarkIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
  },
  searchBarContainer: {
    width: SIZES.width - 32,
    backgroundColor: COLORS.secondaryWhite,
    padding: 16,
    borderRadius: 12,
    height: 52,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.gray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    marginHorizontal: 8,
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
})

export default HomeScreen
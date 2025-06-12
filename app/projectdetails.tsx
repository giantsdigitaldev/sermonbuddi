import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType, FlatList } from 'react-native';
import React from 'react';
import { COLORS, icons, images, SIZES } from '@/constants';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import * as Progress from 'react-native-progress';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-virtualized-view';

const colors = {
  advanced: COLORS.primary,
  intermediate: "#ff566e",
  medium: "#fbd027",
  weak: "#26c2a3",
  completed: COLORS.greeen
};

interface Task {
  id: string;
  title: string;
  dueDate: string;
  participants: string[];
  comments: number;
  attachments: number;
};

const tasks: Task[] = [
  {
    id: "1",
    title: "Brainstorming",
    dueDate: "Dec 15, 2024",
    participants: [images.user1, images.user2, images.user3],
    comments: 6,
    attachments: 3,
  },
  {
    id: "2",
    title: "Design Explore",
    dueDate: "Dec 15, 2024",
    participants: [images.user2, images.user3, images.user3, images.user5, images.user6],
    comments: 7,
    attachments: 5,
  },
  {
    id: "3",
    title: "References",
    dueDate: "Dec 16, 2024",
    participants: [images.user5, images.user7],
    comments: 12,
    attachments: 9,
  },
  {
    id: "4",
    title: "Create Design Flow",
    dueDate: "Dec 16, 2024",
    participants: [images.user3, images.user1, images.user3],
    comments: 15,
    attachments: 4,
  },
  {
    id: "5",
    title: "Create Figma Design",
    dueDate: "Dec 16, 2024",
    participants: [images.user3, images.user1, images.user4],
    comments: 12,
    attachments: 2,
  },
  {
    id: "6",
    title: "Build Frontend App",
    dueDate: "Dec 16, 2024",
    participants: [images.user3, images.user1],
    comments: 19,
    attachments: 3,
  },
];

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { dark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("projectdetailsboarddetails")}
      style={[styles.card, {
        backgroundColor: dark ? COLORS.dark2 : "#fff",
      }]}>
      {/* Task Title and Menu Button */}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, {
          color: dark ? COLORS.white : "#333",
        }]}>{task.title}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={dark ? COLORS.white : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Due Date */}
      <Text style={[styles.dueDate, {
        color: dark ? COLORS.grayscale200 : "#777",
      }]}>Due date: {task.dueDate}</Text>

      {/* Participants Avatars */}
      <View style={styles.avatars}>
        {task.participants.map((avatar, index) => (
          <Image key={index} source={avatar as ImageSourcePropType} style={styles.avatar} />
        ))}
      </View>

      {/* Comments & Attachments */}
      <View style={styles.footer}>
        <View style={styles.iconGroup}>
          <Ionicons name="chatbubble-outline" size={18} color={dark ? COLORS.greyscale300 : "#333"} />
          <Text style={[styles.iconText, { color: dark ? COLORS.greyscale300 : "#333" }]}>{task.comments}</Text>
        </View>
        <View style={styles.iconGroup}>
          <Ionicons name="attach-outline" size={18} color={dark ? COLORS.greyscale300 : "#333"} />
          <Text style={[styles.iconText, {
            color: dark ? COLORS.greyscale300 : "#333",
          }]}>{task.attachments}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


const ProjectDetails = () => {
  const members = [images.user1, images.user2, images.user3];
  const navigation = useNavigation<NavigationProp<any>>();
  const { dark } = useTheme();
  const numberOfTask = 18;
  const numberOfTaskCompleted = 15;
  const progress = numberOfTaskCompleted / numberOfTask;
  const numberOfDaysLeft = 15;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <Image source={images.projectImage} style={styles.banner} />
      {/* Header  */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={styles.arrowBackIcon}
          />
        </TouchableOpacity>
        <View style={styles.rightContainer}>
          <TouchableOpacity>
            <Image
              source={icons.search}
              resizeMode='contain'
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={icons.moreCircle}
              resizeMode='contain'
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={images.logo5} style={styles.logo} />
        </View>
        <View style={styles.membersContainer}>
          {members.slice(0, 3).map((member, index) => (
            <Image
              key={index}
              source={member as ImageSourcePropType}
              style={[styles.memberAvatar, { left: index * -14 }]}
            />
          ))}
          {members.length > 3 && (
            <View style={styles.moreMembers}>
              <Text style={styles.moreText}>+{members.length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Text style={[styles.title, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>Tiki Mobile App Project</Text>
        <Text style={[styles.subtitle, {
          color: dark ? COLORS.grayscale100 : COLORS.greyscale900
        }]}>UI Kit Design Project for Task, Notes, and Reminder Mobile App - December 20, 2024</Text>

        {/* Progress bar item */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressView, {
            backgroundColor: progress === 1 ? colors.completed :
              progress >= 0.75 ? colors.advanced :
                progress >= 0.50 ? colors.intermediate :
                  progress >= 0.35 ? colors.medium : colors.weak
          }]}>
            <Text style={styles.progressText}>{numberOfTaskCompleted} / {numberOfTask}</Text>
          </View>
          <Text style={[styles.daysLeft, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>{numberOfDaysLeft} Days Left, Dec 26 2026</Text>
        </View>
        <Progress.Bar
          progress={numberOfTaskCompleted / numberOfTask}
          width={null}
          height={8}
          unfilledColor={dark ? COLORS.grayscale700 : "#EEEEEE"}
          borderColor={dark ? "transparent" : "#FFF"}
          borderWidth={0}
          style={styles.progressBar}
          color={
            progress === 1 ? colors.completed :
              progress >= 0.75 ? colors.advanced :
                progress >= 0.50 ? colors.intermediate :
                  progress >= 0.35 ? colors.medium : colors.weak
          }
        />

        {/* Task Details  */}
        <ScrollView showsVerticalScrollIndicator={false}
          style={[styles.taskDetailsContainer, {
            backgroundColor: dark ? COLORS.dark1 : "#E9F0FF",
          }]}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskCard task={item} />}
          />
        </ScrollView>
      </View>
      {/* Add Task Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("addnewtaskform")}
        style={styles.addIconContainer}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  )
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 240,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    position: "absolute",
    top: 32,
    left: 16,
  },
  arrowBackIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white
  },
  searchIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white,
    marginRight: 8,
  },
  menuIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: - 72,
    marginLeft: 16,
    marginRight: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logo: {
    width: 24,
    height: 24,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: 'absolute',
  },
  moreMembers: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  moreText: {
    color: COLORS.white,
    fontSize: 24,
    fontFamily: 'bold',
  },
  moreIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900,
  },
  title: {
    fontSize: 32,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    marginTop: 20,
    marginBottom: 12,
  },
  container: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.greyscale900,
    fontFamily: 'regular',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressView: {
    width: 78,
    height: 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: "semiBold"
  },
  daysLeft: {
    fontSize: 12,
    color: COLORS.grayscale700,
    fontFamily: 'regular',
  },
  progressBar: {
    marginTop: 12,
  },
  taskDetailsContainer: {
    marginTop: 24,
    backgroundColor: "#E9F0FF",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: "#333",
  },
  dueDate: {
    fontSize: 14,
    color: "#777",
    marginVertical: 5,
    fontFamily: "regular",
  },
  avatars: {
    flexDirection: "row",
    marginTop: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: -10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
    fontFamily: "regular",
  },
  addIconContainer: {
    height: 58,
    width: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 24,
    right: 16,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  addIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white,
  }
})

export default ProjectDetails
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, FlatList } from 'react-native';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, icons, images, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { categories, myprojects } from '@/data';
import ProjectCard from '@/components/ProjectCard';

interface Category {
  id: string;
  name: string;
}

const Project = () => {
  const { dark } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["1"]);

  const filteredProjects = useMemo(() => {
    return myprojects.filter(project => selectedCategories.includes(project.categoryId));
  }, [selectedCategories, myprojects]);

  // Category item
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={{
        backgroundColor: selectedCategories.includes(item.id) ? COLORS.primary : "transparent",
        padding: 10,
        marginVertical: 5,
        borderColor: COLORS.primary,
        borderWidth: 1.3,
        borderRadius: 24,
        marginRight: 12,
      }}
      onPress={() => toggleCategory(item.id)}>
      <Text style={{ color: selectedCategories.includes(item.id) ? COLORS.white : COLORS.primary }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const updatedCategories = [...selectedCategories];
    const index = updatedCategories.indexOf(categoryId);

    if (index === -1) {
      updatedCategories.push(categoryId);
    } else {
      updatedCategories.splice(index, 1);
    }

    setSelectedCategories(updatedCategories);
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
              source={images.logo as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: COLORS.primary
              }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>
            My Project
          </Text>
        </View>
        <View style={styles.viewContainer}>
          <TouchableOpacity>
            <Image
              source={icons.gallery as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.imageIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={icons.file2 as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.moreIcon, {
                tintColor: COLORS.primary
              }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  /**
   * render content
   */
  const renderContent = () => {
    return (
      <View>
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          horizontal
          renderItem={renderCategoryItem}
        />
        <FlatList
          data={filteredProjects}
          keyExtractor={item => item.id}
          style={{ marginVertical: 16 }}
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
              customStyles={{
                card: {
                  width: SIZES.width - 32
                }
              }}
            />
          )}
        />
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderContent()}
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

export default Project
import { COLORS, FONTS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, FlatList, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const churches = [
    {
      id: '1',
      name: 'All Saints Church',
      location: 'Jakarta',
      image: 'https://images.unsplash.com/photo-1508383329013-3491294871ea?q=80&w=2592&auto=format&fit=crop',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Santa Basilica',
      location: 'Jakarta',
      image: 'https://images.unsplash.com/photo-1594154924036-0775531d24c0?q=80&w=2525&auto=format&fit=crop',
      isFavorite: true,
    },
    {
      id: '3',
      name: 'Grace Cathedral',
      location: 'Jakarta',
      image: 'https://images.unsplash.com/photo-1542649732-441624832157?q=80&w=2600&auto=format&fit=crop',
      isFavorite: false,
    },
  ];

const ChurchCard = ({ church, onFavoriteToggle }: { church: typeof churches[0], onFavoriteToggle: (id: string) => void}) => {
    const { dark } = useTheme();
    return (
      <View style={styles.churchCard}>
        <ImageBackground source={{ uri: church.image }} style={styles.churchCardImage} imageStyle={{ borderRadius: SIZES.radius }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.churchCardGradient}
          >
            <TouchableOpacity style={styles.favoriteButton} onPress={() => onFavoriteToggle(church.id)}>
              <Ionicons name={church.isFavorite ? 'heart' : 'heart-outline'} size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.churchCardInfo}>
              <Text style={styles.churchName}>{church.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-sharp" size={14} color={COLORS.white} />
                <Text style={styles.churchLocation}>{church.location}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };
  

export default function HomeScreen() {
  const { dark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('Church');

  const handleFavoriteToggle = (id: string) => {
    // Handle favorite toggle logic
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? COLORS.black : '#F6F8FE' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View>
                <Text style={[styles.greeting, {color: dark ? COLORS.grayscale100 : COLORS.grayscale700}]}>Hi Emma,</Text>
                <Text style={[styles.headerTitle, { color: dark ? COLORS.white : COLORS.black }]}>Good Morning</Text>
            </View>
            <Image source={{uri: 'https://randomuser.me/api/portraits/women/44.jpg'}} style={styles.profileImage} />
        </View>

        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.grayscale400} />
            <TextInput 
                placeholder="Search Here for Church" 
                placeholderTextColor={COLORS.grayscale400}
                style={[styles.searchInput, {color: dark ? COLORS.white : COLORS.black}]}
            />
        </View>

        <View style={styles.filterContainer}>
            {['Church', 'Connect', 'Events'].map(filter => (
                <TouchableOpacity 
                    key={filter} 
                    style={[
                        styles.filterButton, 
                        activeFilter === filter && {backgroundColor: COLORS.primary},
                        activeFilter !== filter && {backgroundColor: dark ? COLORS.dark2 : COLORS.white}
                    ]}
                    onPress={() => setActiveFilter(filter)}
                >
                    <Text style={[styles.filterButtonText, {color: activeFilter === filter ? COLORS.white : COLORS.grayscale400}]}>{filter}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: dark ? COLORS.white : COLORS.black}]}>Near By Church</Text>
            <FlatList
                data={churches}
                renderItem={({item}) => <ChurchCard church={item} onFavoriteToggle={handleFavoriteToggle} />}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{paddingLeft: SIZES.padding}}
            />
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: dark ? COLORS.white : COLORS.black}]}>Your Sermons</Text>
            <View style={[styles.sermonBanner, {backgroundColor: COLORS.primary}]}>
                <Image source={{uri: 'https://i.ibb.co/6gT5jL5/abstract-faith-concept-illustration.png'}} style={styles.sermonBannerIllustration} />
                <View>
                    <Text style={styles.sermonBannerTitle}>Next Sermons</Text>
                    <Text style={styles.sermonBannerTime}>12:30 PM</Text>
                    <Text style={styles.sermonBannerCountdown}>3 Hours Left</Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>See Details About Church</Text>
                </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingTop: SIZES.padding,
    },
    greeting: {
        ...FONTS.body4,
    },
    headerTitle: {
        ...FONTS.h1,
        fontSize: 28,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(142, 142, 147, 0.12)',
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        margin: SIZES.padding,
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: SIZES.base,
        ...FONTS.body3,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: SIZES.padding,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: SIZES.radius,
    },
    filterButtonText: {
        ...FONTS.body4
    },
    section: {
        marginTop: SIZES.padding * 2,
    },
    sectionTitle: {
        ...FONTS.h2,
        marginHorizontal: SIZES.padding,
        marginBottom: SIZES.padding,
    },
    churchCard: {
        width: width * 0.6,
        height: width * 0.7,
        marginRight: SIZES.padding,
    },
    churchCardImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    churchCardGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
        borderRadius: SIZES.radius,
        justifyContent: 'flex-end',
        padding: SIZES.padding,
    },
    favoriteButton: {
        position: 'absolute',
        top: SIZES.padding,
        right: SIZES.padding,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 4,
        borderRadius: 15,
    },
    churchCardInfo: {
    },
    churchName: {
        ...FONTS.h3,
        color: COLORS.white,
    },
    churchLocation: {
        ...FONTS.body4,
        color: COLORS.white,
        marginLeft: 4,
    },
    sermonBanner: {
        marginHorizontal: SIZES.padding,
        borderRadius: SIZES.radius,
        padding: SIZES.padding,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden'
    },
    sermonBannerIllustration: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 150,
        height: 100,
        opacity: 0.5
    },
    sermonBannerTitle: {
        ...FONTS.body4,
        color: COLORS.white,
    },
    sermonBannerTime: {
        ...FONTS.h2,
        color: COLORS.white,
        marginVertical: 4,
    },
    sermonBannerCountdown: {
        ...FONTS.body4,
        color: COLORS.white,
        opacity: 0.8,
    },
    detailsButton: {
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
    },
    detailsButtonText: {
        ...FONTS.body4,
        color: COLORS.primary,
    }
}); 
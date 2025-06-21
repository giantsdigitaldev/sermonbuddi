import SermonCard from '@/components/SermonCard';
import SermonDetailsModal from '@/components/SermonDetailsModal';
import UploadSermonModal from '@/components/UploadSermonModal';
import { COLORS, FONTS, SIZES, images } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, FlatList, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

const sermons = [
  {
    id: '1',
    title: 'Walking in Faith Through Trials',
    series: 'Faith Journey',
    date: '2024-01-15',
    duration: '45:32',
    views: 1250,
    shares: 127,
    image: 'https://i.ibb.co/6gT5jL5/abstract-faith-concept-illustration.png',
    status: 'published',
    bookmarked: true,
    topic: 'Faith, Perseverance, Trust',
    pastor: 'Pastor John Smith',
    keyPoints: [
      'Faith is tested through trials and tribulations',
      'God uses difficult circumstances to strengthen our faith',
      'Trusting in God\'s plan even when we don\'t understand',
      'The importance of community support during trials'
    ],
    scripture: [
      'James 1:2-4 - "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds..."',
      'Romans 8:28 - "And we know that in all things God works for the good of those who love him..."',
      '2 Corinthians 4:17 - "For our light and momentary troubles are achieving for us an eternal glory..."'
    ],
    content: `In today's sermon, we explore the profound truth that faith is not just about believing when times are good, but about trusting God even when we walk through the darkest valleys of life.

**The Nature of Trials**

Trials come in many forms - health challenges, financial difficulties, relationship struggles, or unexpected life changes. But what makes a trial different from a simple problem is that it tests the very foundation of our faith.

**God's Purpose in Trials**

James tells us to "consider it pure joy" when we face trials. This doesn't mean we should be happy about suffering, but rather that we can rejoice in knowing that God is using these difficult circumstances to produce something beautiful in us.

**Building Endurance**

Every trial we face is an opportunity to build spiritual endurance. Just as physical exercise strengthens our muscles, spiritual trials strengthen our faith muscles. The more we trust God through difficult times, the stronger our faith becomes.

**The Role of Community**

We are not meant to face trials alone. The body of Christ is designed to support and encourage one another. When you're going through a trial, reach out to your church family. When someone else is struggling, be there to support them.

**Trusting God's Plan**

Romans 8:28 reminds us that "in all things God works for the good of those who love him." This doesn't mean everything that happens is good, but that God can work through even the most difficult circumstances to bring about good in our lives.

**Conclusion**

Walking in faith through trials is not easy, but it is possible. When we trust God, lean on our community, and remember that He is working all things for our good, we can face any trial with confidence and hope.`,
    source: 'document'
  },
  {
    id: '2',
    title: 'The Power of Prayer in Daily Life',
    series: 'Spiritual Disciplines',
    date: '2024-01-08',
    duration: '38:15',
    views: 890,
    shares: 94,
    image: 'https://i.ibb.co/yQjD9tY/close-up-hand-holding-stopwatch.png',
    status: 'draft',
    bookmarked: false,
    topic: 'Prayer, Spiritual Growth, Communication with God',
    pastor: 'Pastor Sarah Johnson',
    keyPoints: [
      'Prayer is our direct line of communication with God',
      'Consistent prayer builds intimacy with our Heavenly Father',
      'Prayer changes us more than it changes our circumstances',
      'Different types of prayer for different seasons of life'
    ],
    scripture: [
      'Philippians 4:6-7 - "Do not be anxious about anything, but in every situation, by prayer and petition..."',
      '1 Thessalonians 5:17 - "Pray continually"',
      'Matthew 6:9-13 - The Lord\'s Prayer'
    ],
    content: `Prayer is one of the most powerful tools God has given us, yet it's often one of the most underutilized spiritual disciplines in our lives.

**What is Prayer?**

Prayer is simply talking to God. It's not about using fancy words or following a specific formula. It's about having an honest conversation with our Heavenly Father.

**The Power of Consistent Prayer**

When we pray consistently, we build a relationship with God. Just as any relationship grows stronger through regular communication, our relationship with God deepens through daily prayer.

**Prayer Changes Us**

While we often pray for God to change our circumstances, the truth is that prayer often changes us more than it changes our situation. Through prayer, we gain God's perspective, find peace in difficult times, and develop a heart that's more aligned with His will.

**Types of Prayer**

There are many different types of prayer: thanksgiving, confession, intercession, and petition. Each serves a different purpose in our spiritual growth and relationship with God.

**Making Prayer a Priority**

In our busy lives, it's easy to let prayer fall to the bottom of our priority list. But when we make prayer a daily habit, we begin to see its transformative power in our lives.`,
    source: 'youtube'
  },
  {
    id: '3',
    title: 'Love Your Neighbor as Yourself',
    series: 'Greatest Commandments',
    date: '2024-01-01',
    duration: '42:18',
    views: 1580,
    shares: 156,
    image: 'https://i.ibb.co/6gT5jL5/abstract-faith-concept-illustration.png',
    status: 'published',
    progress: 75,
    bookmarked: true,
    topic: 'Love, Community, Service, Relationships',
    pastor: 'Pastor Michael Davis',
    keyPoints: [
      'Loving our neighbor is a command, not a suggestion',
      'True love requires action, not just feelings',
      'Everyone is our neighbor, regardless of differences',
      'Loving others reflects our love for God'
    ],
    scripture: [
      'Matthew 22:39 - "Love your neighbor as yourself"',
      'Luke 10:25-37 - The Parable of the Good Samaritan',
      '1 John 4:20 - "Whoever claims to love God yet hates a brother or sister is a liar"'
    ],
    content: `The command to "love your neighbor as yourself" is one of the most challenging and beautiful teachings of Jesus. It calls us to a life of selfless service and genuine care for others.

**Who is My Neighbor?**

In the parable of the Good Samaritan, Jesus redefined what it means to be a neighbor. Our neighbor is not just the person who lives next door or looks like us. Our neighbor is anyone in need, regardless of their background, beliefs, or circumstances.

**Love in Action**

True love is not just a feeling; it's an action. Loving our neighbor means being willing to inconvenience ourselves for the sake of others. It means putting their needs before our own comfort and convenience.

**The Connection to Loving God**

Jesus said that loving our neighbor is like the first commandment to love God. In fact, John tells us that we cannot truly love God if we don't love our brothers and sisters. Our love for God is demonstrated through our love for others.

**Practical Ways to Love Our Neighbor**

Loving our neighbor can take many forms: serving in our community, helping those in need, listening to someone who's hurting, or simply being kind to the people we encounter each day.`,
    source: 'recording'
  },
  {
    id: '4',
    title: 'Finding Hope in God\'s Promises',
    series: 'Hope Series',
    date: '2023-12-25',
    duration: '36:45',
    views: 720,
    shares: 88,
    image: 'https://i.ibb.co/6gT5jL5/abstract-faith-concept-illustration.png',
    status: 'draft',
    bookmarked: false,
    topic: 'Hope, God\'s Promises, Trust, Encouragement',
    pastor: 'Pastor Emily Wilson',
    keyPoints: [
      'God\'s promises are our anchor in difficult times',
      'Hope is not wishful thinking but confident expectation',
      'God\'s faithfulness in the past gives us hope for the future',
      'Sharing hope with others multiplies its power'
    ],
    scripture: [
      'Jeremiah 29:11 - "For I know the plans I have for you, declares the Lord..."',
      'Romans 15:13 - "May the God of hope fill you with all joy and peace..."',
      'Hebrews 10:23 - "Let us hold unswervingly to the hope we profess..."'
    ],
    content: `In a world filled with uncertainty and challenges, God's promises provide us with an unshakeable foundation of hope. Today we explore how to find and hold onto hope in God's promises.

**The Nature of God's Promises**

God's promises are not like human promises that can be broken. They are rooted in His unchanging character and His perfect faithfulness. When God makes a promise, He will fulfill it.

**Hope vs. Wishful Thinking**

Biblical hope is not wishful thinking or blind optimism. It is confident expectation based on God's character and His promises. We can hope because we know that God is faithful and true.

**Remembering God's Faithfulness**

One of the best ways to maintain hope is to remember how God has been faithful in the past. The Bible is filled with stories of God's faithfulness, and our own lives are filled with evidence of His goodness.

**Sharing Hope with Others**

Hope is contagious. When we share our hope with others, it not only encourages them but also strengthens our own hope. We are called to be hope-bearers in a world that desperately needs it.`,
    source: 'document'
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const SimpleBarChart = ({ data, color, chartHeight = 20, chartWidth = 40 }: { data: number[], color: string, chartHeight?: number, chartWidth?: number }) => {
    const barWidth = 4;
    const barMargin = 2;
    const maxValue = Math.max(...data, 1);
  
    return (
      <Svg height={chartHeight} width={chartWidth}>
        {data.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = index * (barWidth + barMargin);
          const y = chartHeight - barHeight;
          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={2}
            />
          );
        })}
      </Svg>
    );
  };

const MetricCard = ({ title, value, icon, trendData }: { title: string, value: string, icon: keyof typeof Ionicons.glyphMap, trendData: number[]}) => {
    return (
        <View style={styles.metricCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name={icon} size={18} color={COLORS.white} />
                <Text style={styles.metricCardTitle}>{title}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Text style={styles.metricCardValue}>{value}</Text>
                <SimpleBarChart data={trendData} color={COLORS.white} chartWidth={40} chartHeight={25} />
            </View>
        </View>
    );
};

const SermonsScreen = () => {
  const { dark } = useTheme();
  const router = useRouter();
  
  // Modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [initialTabIndex, setInitialTabIndex] = useState(0);

  // Search states
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchBarAnimation = useState(() => new Animated.Value(0))[0];

  // Filtered sermons based on search with priority ranking
  const filteredSermons = useMemo(() => {
    if (!searchQuery.trim()) return sermons;
    
    const query = searchQuery.toLowerCase();
    
    // Filter and assign priority scores
    const searchResults = sermons
      .map(sermon => {
        let priority = 0;
        let matchFound = false;
        
        // Title match (highest priority)
        if (sermon.title.toLowerCase().includes(query)) {
          priority += 100;
          matchFound = true;
        }
        
        // Series match (second highest)
        if (sermon.series.toLowerCase().includes(query)) {
          priority += 80;
          matchFound = true;
        }
        
        // Topic match (third priority)
        if (sermon.topic.toLowerCase().includes(query)) {
          priority += 60;
          matchFound = true;
        }
        
        // Pastor match (fourth priority)
        if (sermon.pastor.toLowerCase().includes(query)) {
          priority += 40;
          matchFound = true;
        }
        
        // Content match (lowest priority)
        if (sermon.content.toLowerCase().includes(query)) {
          priority += 20;
          matchFound = true;
        }
        
        return matchFound ? { ...sermon, searchPriority: priority } : null;
      })
      .filter((sermon): sermon is typeof sermon & { searchPriority: number } => sermon !== null)
      .sort((a, b) => {
        // Sort by priority (highest first), then by date (newest first)
        if (b.searchPriority !== a.searchPriority) {
          return b.searchPriority - a.searchPriority;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    
    // Remove the searchPriority property before returning
    return searchResults.map(({ searchPriority, ...sermon }) => sermon);
  }, [searchQuery]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      searchBarAnimation.setValue(0);
    };
  }, [searchBarAnimation]);

  const handleSermonPress = (sermon: any) => {
    setSelectedSermon(sermon);
    setInitialTabIndex(0); // Default to sermon tab
    setDetailsModalVisible(true);
  };

  const handleSocialMediaPress = (sermon: any, platform: string) => {
    setSelectedSermon(sermon);
    
    // Map platform to tab index
    const platformToTabIndex: { [key: string]: number } = {
      'twitter': 1,
      'facebook': 2,
      'instagram': 3,
      'linkedin': 4,
      'analytics': 6,
    };
    
    setInitialTabIndex(platformToTabIndex[platform] || 0);
    setDetailsModalVisible(true);
  };

  const handleSaveSermon = (sermonData: any) => {
    // Handle saving sermon data
    console.log('Saving sermon:', sermonData);
    // Here you would typically save to your database
  };

  const handleUploadDocument = (documentData: any) => {
    console.log('Uploading document:', documentData);
    // Navigate to sermon details with document data
    const sermonData = {
      id: Date.now().toString(),
      title: documentData.title || 'Untitled Sermon',
      series: documentData.series || '',
      topic: documentData.topic || '',
      pastor: documentData.pastor || 'Current User',
      date: documentData.date || new Date().toISOString().split('T')[0],
      keyPoints: documentData.keyPoints || [''],
      scripture: documentData.scripture || [''],
      content: documentData.content || '',
      source: 'document',
      documentUri: documentData.documentUri,
    };
    setSelectedSermon(sermonData);
    setDetailsModalVisible(true);
  };

  const handleYouTubeLink = (youtubeData: any) => {
    console.log('Processing YouTube link:', youtubeData);
    // Navigate to sermon details with YouTube data
    const sermonData = {
      id: Date.now().toString(),
      title: youtubeData.title || 'YouTube Sermon',
      series: youtubeData.series || '',
      topic: youtubeData.topic || '',
      pastor: youtubeData.pastor || 'Current User',
      date: youtubeData.date || new Date().toISOString().split('T')[0],
      keyPoints: youtubeData.keyPoints || [''],
      scripture: youtubeData.scripture || [''],
      content: youtubeData.content || '',
      source: 'youtube',
      youtubeUrl: youtubeData.youtubeUrl,
    };
    setSelectedSermon(sermonData);
    setDetailsModalVisible(true);
  };

  const handleLiveRecording = (recordingData: any) => {
    console.log('Processing live recording:', recordingData);
    // Navigate to sermon details with recording data
    const sermonData = {
      id: Date.now().toString(),
      title: recordingData.title || 'Live Recording',
      series: recordingData.series || '',
      topic: recordingData.topic || '',
      pastor: recordingData.pastor || 'Current User',
      date: recordingData.date || new Date().toISOString().split('T')[0],
      keyPoints: recordingData.keyPoints || [''],
      scripture: recordingData.scripture || [''],
      content: recordingData.content || '',
      source: 'recording',
      audioUri: recordingData.audioUri,
      duration: recordingData.duration,
    };
    setSelectedSermon(sermonData);
    setDetailsModalVisible(true);
  };

  // Quick action handlers
  const handleAnalyticsAction = () => {
    console.log('Opening analytics dashboard');
    // This would typically open the analytics dashboard
  };

  const handleScheduleAction = () => {
    console.log('Opening content scheduler');
    // This would typically open the content scheduler
  };

  const handleQuickSocialAction = (platform: string) => {
    // Create a default sermon for quick actions
    const defaultSermon = {
      id: 'quick-action',
      title: 'Quick Social Media Action',
      series: 'General',
      topic: 'Social Media',
      pastor: 'Current User',
      date: new Date().toISOString().split('T')[0],
      keyPoints: [''],
      scripture: [''],
      content: '',
      views: 0,
      shares: 0,
      duration: '00:00',
      image: 'https://i.ibb.co/6gT5jL5/abstract-faith-concept-illustration.png',
      status: 'draft',
      bookmarked: false,
    };
    
    handleSocialMediaPress(defaultSermon, platform);
  };

  const toggleSearch = () => {
    if (isSearchActive) {
      // Close search - slide back to icon position
      Animated.timing(searchBarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start((finished) => {
        if (finished) {
          setIsSearchActive(false);
          setSearchQuery('');
        }
      });
    } else {
      // Open search - slide from icon position
      setIsSearchActive(true);
      // Small delay to ensure state is set before animation
      setTimeout(() => {
        Animated.timing(searchBarAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 10);
    }
  };

  const closeSearch = () => {
    Animated.timing(searchBarAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start((finished) => {
      if (finished) {
        setIsSearchActive(false);
        setSearchQuery('');
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, {
      backgroundColor: dark ? COLORS.dark1 : COLORS.white,
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.greyscale900,
            opacity: isSearchActive ? 0 : 1,
          }]}>
            Sermons
          </Text>
          <Text style={[styles.subtitle, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
            opacity: isSearchActive ? 0 : 1,
          }]}>
            Manage and share your sermons
          </Text>
          
          {/* Search Bar */}
          {isSearchActive && (
            <Animated.View 
              style={[
                styles.searchBarContainer,
                {
                  width: searchBarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 280],
                  }),
                  opacity: searchBarAnimation,
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                  position: 'absolute',
                  top: 8, // Position to align with title area
                  left: 0,
                }
              ]}
            >
              <Ionicons 
                name="search" 
                size={20} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
              />
              <TextInput
                style={[styles.searchInput, {
                  color: dark ? COLORS.white : COLORS.greyscale900,
                }]}
                placeholder="Search sermons..."
                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons 
                    name="close-circle" 
                    size={20} 
                    color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                  />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>
        
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerActionButton, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
            }]}
            onPress={toggleSearch}
          >
            <Ionicons 
              name={isSearchActive ? "close" : "search"} 
              size={20} 
              color={dark ? COLORS.primary : COLORS.greyscale900} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerActionButton, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
            }]}
            onPress={handleAnalyticsAction}
          >
            <Ionicons 
              name="stats-chart-outline" 
              size={20} 
              color={dark ? COLORS.primary : COLORS.greyscale900} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerActionButton, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
            }]}
            onPress={handleScheduleAction}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={dark ? COLORS.primary : COLORS.greyscale900} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Image with Stats Slider */}
        <ImageBackground
            source={images.churchHeader}
            style={styles.headerImage}
            imageStyle={styles.headerImageStyle}
        >
            <View style={styles.headerOverlay} />
            <View>
                <Text style={styles.headerImageTitle}>Sermon Insights</Text>
                <Text style={styles.headerImageSubtitle}>Your weekly sermon performance</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContainer}>
                <MetricCard
                    title="Total Sermons"
                    value={filteredSermons.length.toString()}
                    icon="book-outline"
                    trendData={[10, 12, 8, 15, 11, 13, 9]}
                />
                <MetricCard
                    title="Total Views"
                    value={filteredSermons.reduce((total, sermon) => total + sermon.views, 0).toLocaleString()}
                    icon="eye-outline"
                    trendData={[15, 25, 18, 30, 22, 28, 20]}
                />
                <MetricCard
                    title="Total Shares"
                    value={filteredSermons.reduce((total, sermon) => total + sermon.shares, 0).toLocaleString()}
                    icon="share-social-outline"
                    trendData={[12, 9, 11, 7, 8, 6]}
                />
            </ScrollView>
        </ImageBackground>

        {/* Sermons List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {
              color: dark ? COLORS.white : COLORS.greyscale900,
            }]}>
              Recent Sermons
            </Text>
            <Text style={[styles.sectionSubtitle, {
              color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
            }]}>
              {filteredSermons.length} sermons
            </Text>
          </View>
          
          {filteredSermons.length > 0 ? (
            <FlatList
              data={filteredSermons}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SermonCard
                  sermon={item}
                  onPress={() => handleSermonPress(item)}
                  onSocialMediaPress={(platform) => handleSocialMediaPress(item, platform)}
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sermonsList}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons 
                name="search" 
                size={48} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
              />
              <Text style={[styles.noResultsText, {
                color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
              }]}>
                {isSearchActive && searchQuery ? 'No sermons found' : 'No sermons available'}
              </Text>
              <Text style={[styles.noResultsSubtext, {
                color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
              }]}>
                {isSearchActive && searchQuery ? `Try different search terms for "${searchQuery}"` : 'Add your first sermon to get started'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, {
          backgroundColor: COLORS.primary,
        }]}
        onPress={() => setUploadModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Upload Sermon Modal */}
      <UploadSermonModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUpload={handleUploadDocument}
        onYouTubeLink={handleYouTubeLink}
        onRecordingComplete={handleLiveRecording}
      />

      {/* Sermon Details Modal */}
      <SermonDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        sermonData={selectedSermon}
        onSave={handleSaveSermon}
        initialTabIndex={initialTabIndex}
      />
    </SafeAreaView>
  );
};

export default SermonsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    position: 'relative',
    minHeight: 60, // Ensure consistent height
  },
  title: {
    fontSize: 28,
    fontFamily: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'regular',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    maxWidth: 280,
    height: 40, // Fixed height to match button height
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    marginLeft: 8,
    marginRight: 8,
    minHeight: 24,
    paddingVertical: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'regular',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  sliderContainer: {
    gap: 16,
  },
  metricCard: {
    width: 140,
    borderRadius: 24,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  metricCardTitle: {
    fontSize: 12,
    fontFamily: 'medium',
    color: COLORS.white,
  },
  metricCardValue: {
    fontSize: 22,
    fontFamily: 'bold',
    color: COLORS.white,
  },
  sermonsList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 1000,
  },
  headerImage: {
    height: 150,
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 24,
    marginTop: 16,
  },
  headerImageStyle: {
    resizeMode: 'cover',
    borderRadius: 16,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(36, 107, 253, 0.7)',
    borderRadius: 16,
  },
  headerImageTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  headerImageSubtitle: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.white,
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'bold',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.grayscale100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addSermonButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    marginHorizontal: SIZES.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radius-10,
  },
  cardContent: {
    flex: 1,
    marginHorizontal: SIZES.padding,
  },
  cardTitle: {
    ...FONTS.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...FONTS.body4,
    fontSize: 13,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...FONTS.body4,
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'medium',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookIcon: {
    // Icon styling is handled by Ionicons
  },
  textContainer: {
    flex: 1,
  },
  mainContentContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  bottomContainer: {
    marginTop: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  socialActionButton: {
    padding: 4,
  },
}); 
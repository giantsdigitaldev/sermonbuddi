import BackgroundSelectionModal from '@/components/BackgroundSelectionModal';
import CalendarModal from '@/components/CalendarModal';
import XLogo from '@/components/XLogo';
import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height: windowHeight } = Dimensions.get('window');

interface ScheduledPost {
  id: string;
  platform: string;
  post: {
    content?: string;
    quote?: string;
    image?: string;
  };
  scheduledAt: Date;
  status: 'published' | 'scheduled' | 'draft';
}

interface DaySchedule {
  date: Date;
  dayName: string;
  dayNumber: string;
  posts: ScheduledPost[];
}

interface SectionData {
  title: string;
  date: Date;
  dayName: string;
  dayNumber: string;
  data: ScheduledPost[];
}

// Mock data for social posts
const mockSocialPosts = {
  twitter: [
    { content: "Faith is not the absence of fear, but the courage to face it with God by your side. #FaithJourney #TrustGod" },
    { content: "Today's message reminded us that every trial is an opportunity for growth. What challenges are you facing? #Growth #Faith" },
    { content: "The power of community in our faith journey cannot be overstated. We're stronger together. #Community #Faith" },
    { content: "God's timing is perfect, even when we don't understand it. Trust the process. #Trust #Faith" },
    { content: "Every step of faith, no matter how small, brings us closer to God's purpose for our lives. #Purpose #Faith" },
    { content: "The greatest testimony is a life transformed by God's love. Share your story. #Testimony #Love" },
    { content: "Prayer is not just asking, it's listening. Take time to hear God's voice today. #Prayer #Listen" }
  ],
  facebook: [
    { content: "Walking in faith through trials isn't easy, but it's worth it. Today's sermon reminded us that God uses our struggles to strengthen us and draw us closer to Him. What trials are you currently facing? How has God been working in your life through difficult circumstances?" },
    { content: "Community is essential in our faith journey. We weren't meant to walk this path alone. Today we explored how supporting one another through trials makes us all stronger. Who in your life needs your support right now?" },
    { content: "God's timing is always perfect, even when it doesn't make sense to us. Trusting in His plan requires faith, but He never fails. What are you waiting for God to do in your life?" },
    { content: "Every challenge we face is an opportunity for growth. Instead of asking 'Why me?', let's ask 'What can I learn from this?' How has God used difficult situations to grow your faith?" },
    { content: "Prayer is our direct line to God. It's not just about asking for things, but about building a relationship with our Heavenly Father. How has prayer changed your life?" },
    { content: "God's love transforms lives. When we truly experience His love, we can't help but share it with others. How has God's love changed you? Share your story to encourage someone else." },
    { content: "Faith is a journey, not a destination. Each day brings new opportunities to trust God more deeply. What step of faith is God asking you to take today?" }
  ],
  instagram: [
    { content: "Faith over fear ✨", quote: "Faith is not the absence of fear, but the courage to face it with God by your side." },
    { content: "Growth through trials 🌱", quote: "Every trial is an opportunity for growth and deeper faith." },
    { content: "Community matters 💙", quote: "We're stronger together in faith and love." },
    { content: "Perfect timing ⏰", quote: "God's timing is perfect, even when we don't understand it." },
    { content: "Purpose driven 🎯", quote: "Every step of faith brings us closer to God's purpose." },
    { content: "Transformed lives ✝️", quote: "The greatest testimony is a life transformed by God's love." },
    { content: "Prayer power 🙏", quote: "Prayer is not just asking, it's listening to God's voice." }
  ],
  linkedin: [
    { content: "Leadership insights from today's message: True leadership requires faith, courage, and the willingness to face challenges head-on. The best leaders understand that trials are opportunities for growth, not setbacks. How are you developing your leadership through faith?" },
    { content: "Professional growth often comes through challenges. Today's sermon reminded us that every difficulty we face is preparing us for something greater. What professional challenges are you currently navigating? How are they shaping your character and skills?" },
    { content: "Building authentic relationships in the workplace starts with understanding that we're all on a journey. Today we explored how supporting others through their trials creates stronger teams and communities. How are you supporting your colleagues?" },
    { content: "Strategic patience is a key leadership quality. God's timing teaches us that rushing decisions often leads to missed opportunities. How are you practicing patience in your professional life?" },
    { content: "Continuous learning is essential for growth. Every experience, good or bad, teaches us something valuable. What recent challenge taught you an important lesson?" },
    { content: "Authentic leadership comes from being transformed by purpose. When we understand our 'why', we lead with greater clarity and passion. What's driving your professional journey?" },
    { content: "Mindful communication starts with listening. Just as prayer involves listening to God, effective leadership involves truly hearing others. How are you improving your listening skills?" }
  ]
};

type ViewMode = 'timeline' | 'calendar' | 'month' | 'week' | 'day';

const ScheduleScreen = () => {
  const { dark } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  // Modal states
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isBgModalVisible, setBgModalVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Timeline animation states
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(windowHeight);
  
  // Generate scheduled posts
  const scheduledPosts = useMemo(() => {
    const posts: ScheduledPost[] = [];
    const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
    
    // Generate posts for the next 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const postDate = new Date();
      postDate.setDate(postDate.getDate() + dayOffset);
      
      platforms.forEach((platform, platformIndex) => {
        const postTime = new Date(postDate);
        // Distribute posts throughout the day
        const hour = 9 + (platformIndex * 3); // 9 AM, 12 PM, 3 PM, 6 PM
        postTime.setHours(hour, Math.floor(Math.random() * 60));
        
        const mockPost = mockSocialPosts[platform as keyof typeof mockSocialPosts][dayOffset % 7];
        
        posts.push({
          id: `${platform}-${dayOffset}-${platformIndex}`,
          platform,
          post: mockPost,
          scheduledAt: postTime,
          status: postTime < new Date() ? 'published' : 'scheduled'
        });
      });
    }
    return posts;
  }, []);

  // Group posts by day for SectionList
  const sections: SectionData[] = useMemo(() => {
    const dayMap = new Map<string, DaySchedule>();
    
    scheduledPosts.forEach(post => {
      const dateKey = post.scheduledAt.toDateString();
      const date = post.scheduledAt;
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString(),
          posts: []
        });
      }
      
      dayMap.get(dateKey)!.posts.push(post);
    });
    
    // Sort posts within each day by time
    dayMap.forEach(day => {
      day.posts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    });
    
    // Convert to array and sort by date
    const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    return sortedDays.map(day => ({
      title: day.date.toDateString(),
      date: day.date,
      dayName: day.dayName,
      dayNumber: day.dayNumber,
      data: day.posts,
    }));
  }, [scheduledPosts]);

  const handleDateChange = useCallback((newDate: Date) => {
    if (selectedPost) {
      // Update the selected post's date
      const updatedDate = new Date(selectedPost.scheduledAt);
      updatedDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      // In a real app, you would update the database here
    }
    setDatePickerVisible(false);
  }, [selectedPost]);

  const handleSelectBackground = useCallback((image: string) => {
    if (editingPostId) {
      // In a real app, you would update the database here
    }
    setBgModalVisible(false);
    setEditingPostId(null);
  }, [editingPostId]);

  const getPlatformIcon = useCallback((platform: string) => {
    switch (platform) {
      case 'twitter': return 'close-sharp';
      case 'facebook': return 'logo-facebook';
      case 'instagram': return 'logo-instagram';
      case 'linkedin': return 'logo-linkedin';
      default: return 'globe';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'published': return COLORS.success;
      case 'scheduled': return COLORS.primary;
      case 'draft': return COLORS.warning;
      default: return COLORS.grayscale400;
    }
  }, []);

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewModeScroll}>
        {[
          { key: 'timeline', label: 'Timeline', icon: 'list' },
          { key: 'calendar', label: 'Calendar', icon: 'calendar' },
          { key: 'month', label: 'Month', icon: 'calendar-outline' },
          { key: 'week', label: 'Week', icon: 'calendar-clear' },
          { key: 'day', label: 'Day', icon: 'today' }
        ].map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.viewModeButton,
              viewMode === mode.key && { backgroundColor: COLORS.primary }
            ]}
            onPress={() => setViewMode(mode.key as ViewMode)}
          >
            <Ionicons
              name={mode.icon as any}
              size={16}
              color={viewMode === mode.key ? COLORS.white : (dark ? COLORS.grayscale400 : COLORS.grayscale700)}
            />
            <Text style={[
              styles.viewModeText,
              { color: viewMode === mode.key ? COLORS.white : (dark ? COLORS.grayscale400 : COLORS.grayscale700) }
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>
    </View>
  );

  const renderTimelineView = () => {
    // Create a smooth scroll-based animation for the timeline indicator
    const timelineHeight = sections.length * 80; // Approximate height of timeline
    const indicatorHeight = 30; // Height of the moving indicator
    
    // Calculate the timeline indicator position based on scroll
    const indicatorTranslateY = scrollY.interpolate({
      inputRange: [0, Math.max(1, contentHeight - windowHeight)],
      outputRange: [0, Math.max(0, timelineHeight - indicatorHeight)],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.timelineContainer}>
        {/* Timeline Bar */}
        <View style={styles.timelineLineContainer}>
          <View style={[styles.timelineTrack, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200 }]} />
          
          {/* Moving Indicator - Smooth animated line */}
          <Animated.View style={[styles.timelineIndicator, { transform: [{ translateY: indicatorTranslateY }] }]} />

          {/* Gray dots for each day */}
          {sections.map((day, index) => (
            <View
              key={`timeline-dot-${index}`}
              style={[
                {
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                  left: '50%',
                  marginLeft: -6,
                },
                { top: index * 80 + 32 }
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={8}
          onContentSizeChange={(w, h) => setContentHeight(h)}
          renderSectionHeader={({ section }) => (
            <View style={[styles.dayHeader, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayName, { color: dark ? COLORS.white : COLORS.black }]}>
                  {section.dayName}
                </Text>
                <Text style={[styles.dayDate, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                  {section.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.dayStats}>
                <Text style={[styles.postCount, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                  {section.data.length} posts
                </Text>
              </View>
            </View>
          )}
          renderItem={({ item, section }) => (
            <View style={styles.dayPostsContainer}>
              <View key={item.id} style={[styles.scheduledPostCard, { backgroundColor: dark ? COLORS.dark3 : COLORS.white }]}>
                {/* Post Header */}
                <View style={styles.scheduledPostHeader}>
                  <View style={styles.platformInfo}>
                    {item.platform === 'twitter' ? (
                      <XLogo color={COLORS.primary} size={18} />
                    ) : (
                      <Ionicons name={getPlatformIcon(item.platform)} size={18} color={COLORS.primary} />
                    )}
                    <Text style={[styles.platformName, { color: dark ? COLORS.white : COLORS.black, marginLeft: 8 }]}>
                      {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.postMeta}>
                    <Text style={[styles.postTime, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700, marginRight: 8 }]}>
                      {item.scheduledAt.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Post Preview */}
                <View style={styles.postPreview}>
                  <Text 
                    style={[styles.postPreviewText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}
                    numberOfLines={2}
                  >
                    {item.post.content || item.post.quote || 'Post content preview...'}
                  </Text>
                </View>

                {/* Post Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.postActionButton}
                    onPress={() => {
                      setSelectedPost(item);
                      setDatePickerVisible(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={16} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
                    <Text style={[styles.metaText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                      {`${item.scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${item.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                    </Text>
                  </TouchableOpacity>
                  
                  {item.platform === 'instagram' && (
                    <TouchableOpacity 
                      style={styles.postActionButton}
                      onPress={() => {
                        setEditingPostId(item.id);
                        setBgModalVisible(true);
                      }}
                    >
                      <Ionicons name="image-outline" size={16} color={COLORS.secondary} />
                      <Text style={[styles.actionText, { color: COLORS.secondary }]}>Background</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity style={styles.postActionButton}>
                    <Ionicons name="create-outline" size={16} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
                    <Text style={[styles.actionText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: 20 }} />}
          ListFooterComponent={() => <View style={{ height: 40 }} />}
          contentContainerStyle={styles.timelineContentContainer}
        />
      </View>
    );
  };

  const renderCalendarView = () => (
    <View style={styles.calendarContainer}>
      <Text style={[styles.placeholderText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
        Calendar View - Coming Soon
      </Text>
    </View>
  );

  const renderMonthView = () => (
    <View style={styles.calendarContainer}>
      <Text style={[styles.placeholderText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
        Month View - Coming Soon
      </Text>
    </View>
  );

  const renderWeekView = () => (
    <View style={styles.calendarContainer}>
      <Text style={[styles.placeholderText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
        Week View - Coming Soon
      </Text>
    </View>
  );

  const renderDayView = () => (
    <View style={styles.calendarContainer}>
      <Text style={[styles.placeholderText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
        Day View - Coming Soon
      </Text>
    </View>
  );

  const renderContentView = () => {
    switch (viewMode) {
      case 'timeline':
        return renderTimelineView();
      case 'calendar':
        return renderCalendarView();
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderTimelineView();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Schedule
          </Text>
          <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
            Manage your social media content
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => {
            // Handle adding new scheduled post
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Content */}
      {renderContentView()}

      {/* Modals */}
      {isDatePickerVisible && selectedPost && (
        <CalendarModal
          visible={isDatePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onConfirm={handleDateChange}
          initialDate={selectedPost.scheduledAt}
        />
      )}
      
      <BackgroundSelectionModal
        visible={isBgModalVisible}
        onClose={() => setBgModalVisible(false)}
        onSelect={handleSelectBackground}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding3,
    paddingVertical: SIZES.padding2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: SIZES.body4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeContainer: {
    paddingVertical: SIZES.padding2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  viewModeScroll: {
    paddingHorizontal: SIZES.padding3,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding2,
    paddingVertical: SIZES.padding,
    marginRight: SIZES.padding,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.grayscale100,
  },
  viewModeText: {
    fontSize: SIZES.body4,
    fontWeight: '500',
    marginLeft: 4,
  },
  timelineContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  timelineLineContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 12,
  },
  timelineTrack: {
    width: 2,
    height: '100%',
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    top: 0,
  },
  timelineIndicator: {
    position: 'absolute',
    width: 3,
    height: 30,
    backgroundColor: COLORS.primary,
    left: '50%',
    marginLeft: -1.5,
    top: 0,
  },
  timelineDateContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timelineDateText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineScrollView: {
    flex: 1,
  },
  timelineContentContainer: {
    paddingHorizontal: SIZES.padding2,
    paddingTop: 12,
  },
  dayContainer: {
    marginBottom: SIZES.padding3,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingLeft: SIZES.padding / 2,
    // No margin bottom here, handled by SectionList
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: SIZES.body3,
    fontWeight: '600',
  },
  dayDate: {
    fontSize: SIZES.body4,
    marginTop: 2,
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  postCount: {
    fontSize: SIZES.body4,
  },
  dayPostsContainer: {
    paddingLeft: SIZES.padding / 2,
    paddingTop: SIZES.padding,
  },
  scheduledPostCard: {
    marginBottom: SIZES.padding2,
    borderRadius: SIZES.radius,
    padding: SIZES.padding2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduledPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    fontSize: SIZES.body4,
    fontWeight: '600',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: SIZES.body4,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postPreview: {
    marginBottom: SIZES.padding,
  },
  metaText: {
    fontSize: SIZES.body4,
    marginLeft: 4,
    textDecorationLine: 'none',
  },
  postPreviewText: {
    fontSize: SIZES.body4,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.padding2,
  },
  actionText: {
    fontSize: SIZES.body4,
    marginLeft: 4,
  },
  emptyDayContainer: {
    marginLeft: 40,
    alignItems: 'center',
    paddingVertical: SIZES.padding3,
  },
  emptyDayText: {
    fontSize: SIZES.body4,
    marginTop: SIZES.padding,
  },
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: SIZES.body3,
    textAlign: 'center',
  },
});

export default ScheduleScreen; 
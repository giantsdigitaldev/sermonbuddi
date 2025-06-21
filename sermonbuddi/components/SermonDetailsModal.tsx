import { COLORS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { TouchableOpacity as GHTouchableOpacity, PanGestureHandler, State } from 'react-native-gesture-handler';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { SceneMap, TabView } from 'react-native-tab-view';
import BackgroundSelectionModal from './BackgroundSelectionModal';
import CalendarModal from './CalendarModal';
import MetricSliderCard from './MetricSliderCard';
import XLogo from './XLogo';

interface SermonDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  sermonData?: {
    id: string;
    title: string;
    series: string;
    topic: string;
    pastor: string;
    date: string;
    keyPoints: string[];
    scripture: string[];
    content: string;
    source?: string;
    documentUri?: string;
    youtubeUrl?: string;
    audioUri?: string;
    duration?: string;
  };
  onSave?: (sermonData: SermonData) => void;
  initialTabIndex?: number;
}

interface SermonData {
  id: string;
  title: string;
  series: string;
  topic: string;
  pastor: string;
  date: string;
  keyPoints: string[];
  scripture: string[];
  content: string;
}

interface SocialPostCardProps {
  platform: string;
  post: any;
  dark: boolean;
  onEditBackground: () => void;
  scheduledAt?: Date;
  onDatePress?: () => void;
  isActive?: boolean;
  dragHandle?: React.ReactNode;
}

interface ScheduledPost {
  id: string;
  platform: string;
  post: any;
  scheduledAt: Date;
  status: 'scheduled' | 'published' | 'draft';
}

const initialLayout = { width: Dimensions.get('window').width };

// Mock data for social media posts
const mockSocialPosts = {
  twitter: Array(7).fill(0).map((_, i) => ({
    id: `twitter-${i}`,
    user: { name: 'Pastor John', handle: '@pastorjohn', avatar: 'https://i.pravatar.cc/150?u=pastorjohn' },
    content: "Reflecting on this week's message on faith. Remember, even a little faith can move mountains. #faith #sermon #inspiration",
    timestamp: '2h',
    stats: { comments: 12, retweets: 34, likes: 156 }
  })),
  facebook: Array(7).fill(0).map((_, i) => ({
    id: `facebook-${i}`,
    user: { name: 'Pastor John', avatar: 'https://i.pravatar.cc/150?u=pastorjohn' },
    content: 'A deeper dive into our sermon on "Walking in Faith Through Trials." It\'s during the toughest times that our faith is truly forged. What were your key takeaways from the message? Let\'s discuss in the comments below! #FaithJourney #Community #SermonDiscussion',
    timestamp: '3 hours ago',
    stats: { likes: '254', comments: '48 Comments', shares: '22 Shares' }
  })),
  instagram: Array(7).fill(0).map((_, i) => ({
    id: `instagram-${i}`,
    user: { name: 'Jenny Samos', location: 'Sequoia, California', avatar: 'https://i.pravatar.cc/150?u=jennysamos' },
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2024&auto=format&fit=crop',
    quote: '"porceline is just perfect! It helps keep my acne and eye bags under control. The ingredients are all natural and sustainable. I\'ve never felt better!"',
  })),
  linkedin: Array(7).fill(0).map((_, i) => ({
    id: `linkedin-${i}`,
    user: { name: 'Pastor John Smith', headline: 'Lead Pastor | Leadership & Faith Speaker', avatar: 'https://i.pravatar.cc/150?u=pastorjohn' },
    content: 'This week, our discussion revolved around the theme of "Leading with Faith in the Workplace." A key principle we explored was servant leadership, a model that prioritizes the growth and well-being of people and the communities to which they belong. How do you apply principles of faith in your professional life? #Leadership #FaithAtWork #ServantLeadership #ProfessionalDevelopment',
    timestamp: '1d',
    stats: { likes: '312', comments: '56' }
  }))
};

const iconColors = [
  COLORS.primary,      // Blue
  COLORS.success,      // Green
  COLORS.warning,      // Orange
  COLORS.info,         // Cyan
  COLORS.secondary,    // Purple
  COLORS.tertiary,     // Pink
];

const SermonRoute = ({ sermonDetails, sermonData, dark }: { sermonDetails: SermonData, sermonData: any, dark: boolean }) => (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Key Points */}
      {sermonDetails.keyPoints && sermonDetails.keyPoints.length > 0 && sermonDetails.keyPoints[0] && (
        <View style={styles.infoSection}>
          <View style={styles.labelContainer}>
            <Ionicons name="list" size={16} color={iconColors[0]} />
            <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Key Sermon Points
            </Text>
          </View>
          <View style={[styles.infoValue, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
            {sermonDetails.keyPoints.map((point, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bulletPoint, { color: COLORS.primary }]}>•</Text>
                <Text style={[styles.infoText, { color: dark ? COLORS.white : COLORS.greyscale900, flex: 1 }]}>
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Scripture References */}
      {sermonDetails.scripture && sermonDetails.scripture.length > 0 && sermonDetails.scripture[0] && (
        <View style={styles.infoSection}>
          <View style={styles.labelContainer}>
            <Ionicons name="book" size={16} color={iconColors[4]} />
            <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Scripture References
            </Text>
          </View>
          <View style={[styles.infoValue, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
            {sermonDetails.scripture.map((verse, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.bulletPoint, { color: COLORS.secondary }]}>•</Text>
                <Text style={[styles.infoText, { color: dark ? COLORS.white : COLORS.greyscale900, flex: 1 }]}>
                  {verse}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Practical Applications */}
      <View style={styles.infoSection}>
        <View style={styles.labelContainer}>
          <Ionicons name="bulb-outline" size={16} color={iconColors[2]} />
          <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Practical Applications
          </Text>
        </View>
        <View style={[styles.infoValue, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
          <Text style={[styles.infoText, { color: dark ? COLORS.white : COLORS.greyscale900, lineHeight: 22 }]}>
            Apply the principles from this sermon in your daily life through prayer, reflection, and intentional actions that align with God's word.
          </Text>
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.infoSection}>
        <View style={styles.labelContainer}>
          <Ionicons name="hand-right-outline" size={16} color={iconColors[5]} />
          <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Call to Action
          </Text>
        </View>
        <View style={[styles.infoValue, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
          <Text style={[styles.infoText, { color: dark ? COLORS.white : COLORS.greyscale900, lineHeight: 22 }]}>
            Take the next step in your faith journey by sharing this message with others, joining a small group, or serving in your community.
          </Text>
        </View>
      </View>

      {/* Sermon Content */}
      {sermonDetails.content && (
        <View style={styles.infoSection}>
          <View style={styles.labelContainer}>
            <Ionicons name="document" size={16} color={iconColors[1]} />
            <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Sermon Content
            </Text>
          </View>
          <View style={[styles.infoValue, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
            <Text style={[styles.infoText, { color: dark ? COLORS.white : COLORS.greyscale900, lineHeight: 22 }]}>
              {sermonDetails.content}
            </Text>
          </View>
        </View>
      )}

      {/* Sermon Topics */}
      {sermonDetails.topic && (
        <View style={styles.infoSection}>
          <View style={styles.labelContainer}>
            <Ionicons name="pricetags-outline" size={16} color={iconColors[5]} />
            <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Sermon Topics
            </Text>
          </View>
          <View style={[styles.infoValue, styles.topicSectionValue]}>
            {sermonDetails.topic.split(',').map((tag, index) => (
              <View key={index} style={[styles.topicTag, { backgroundColor: COLORS.primary + '20' }]}>
                <Text style={[styles.topicTagText, { color: COLORS.primary }]}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Source File */}
      {sermonData?.source && (
        <View style={styles.infoSection}>
          <View style={styles.labelContainer}>
            <Ionicons name="attach-outline" size={16} color={iconColors[3]} />
            <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Source File
            </Text>
          </View>
          <View style={[styles.infoValue, { padding: 0, borderWidth: 0 }]}>
            {sermonData.source === 'document' && (
                <View style={styles.sourceFileContainer}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                    <Text style={[styles.sourceFileText, {color: dark ? COLORS.white: COLORS.black}]}>Document: {sermonData.documentUri?.split('/').pop()}</Text>
                </View>
            )}
            {sermonData.source === 'youtube' && (
                <View style={styles.sourceFileContainer}>
                    <Ionicons name="logo-youtube" size={24} color={COLORS.error} />
                    <Text style={[styles.sourceFileText, {color: dark ? COLORS.white: COLORS.black}]}>YouTube: {sermonData.youtubeUrl}</Text>
                </View>
            )}
             {sermonData.source === 'recording' && (
                <View style={styles.sourceFileContainer}>
                    <Ionicons name="mic-outline" size={24} color={COLORS.success} />
                    <Text style={[styles.sourceFileText, {color: dark ? COLORS.white: COLORS.black}]}>Recording ({sermonData.duration})</Text>
                </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
);

const SocialPostCard = ({
  platform,
  post,
  dark,
  onEditBackground,
  scheduledAt,
  onDatePress,
  isActive,
  dragHandle,
}: SocialPostCardProps) => {
  const [showPrimaryContent, setShowPrimaryContent] = useState(true);

  const activeStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isActive ? 8 : 4 },
    shadowOpacity: isActive ? 0.3 : 0.1,
    shadowRadius: isActive ? 12 : 6,
    elevation: isActive ? 10 : 5,
  };

  const toggleContent = () => {
    setShowPrimaryContent(!showPrimaryContent);
  };

  const isPublished = scheduledAt ? new Date() > scheduledAt : true;

  const renderMetaStats = () => {
    if (platform === 'facebook') {
      return (
        <View style={[styles.socialStatContainer, { justifyContent: 'space-between' }]}>
          <Text style={styles.socialStatItem}>{post.stats.likes}</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={styles.socialStatItem}>{post.stats.comments}</Text>
            <Text style={styles.socialStatItem}>{post.stats.shares}</Text>
          </View>
        </View>
      );
    }
    
    const stats = platform === 'twitter'
      ? [
          `${post.stats.comments} Comments`,
          `${post.stats.retweets} Retweets`,
          `${post.stats.likes} Likes`,
        ]
      : [
          `${post.stats.likes} Likes`,
          `${post.stats.comments} Comments`,
        ];

    return (
      <View style={styles.socialStatContainer}>
        {stats.map((stat, index) => (
          <Text key={index} style={styles.socialStatItem}>{stat}</Text>
        ))}
      </View>
    );
  };

  const renderDateInfo = () => {
    return (
      <GHTouchableOpacity onPress={onDatePress} style={styles.dateTouchableMeta}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        <Text style={styles.scheduledText}>
          {scheduledAt ? 
            `${scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 
            'Set schedule'
          }
        </Text>
      </GHTouchableOpacity>
    );
  };

  const renderMetaContent = () => {
    if (platform === 'instagram') {
      return null;
    }
    
    const primaryContent = renderDateInfo();
    const secondaryContent = renderMetaStats();

    return (
      <>
        {showPrimaryContent ? primaryContent : secondaryContent}
        <TouchableOpacity onPress={toggleContent} style={styles.metaToggle}>
          <Ionicons
            name={showPrimaryContent ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={COLORS.grayscale700}
          />
        </TouchableOpacity>
      </>
    );
  };
  
  switch (platform) {
    case 'twitter':
      return (
        <View style={[styles.socialCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }, activeStyle]}>
          <View style={styles.socialHeader}>
            <Image source={{ uri: post.user.avatar }} style={styles.socialAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.socialUser, { color: dark ? COLORS.white : COLORS.black }]}>{post.user.name}</Text>
              <Text style={styles.socialHandle}>{post.user.handle}</Text>
            </View>
            <View style={styles.headerIconsContainer}>
              {dragHandle}
              <Text style={{ fontFamily: 'bold', fontSize: 20, color: dark ? COLORS.white : COLORS.black }}>X</Text>
            </View>
          </View>
          <Text style={[styles.socialContent, { color: dark ? COLORS.white : COLORS.black }]}>{post.content}</Text>
          <View style={styles.socialStats}>
            {renderMetaContent()}
          </View>
        </View>
      );
    case 'facebook':
      return (
        <View style={[styles.socialCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }, activeStyle]}>
          <View style={styles.socialHeader}>
            <Image source={{ uri: post.user.avatar }} style={styles.socialAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.socialUser, { color: dark ? COLORS.white : COLORS.black }]}>{post.user.name}</Text>
            </View>
            <View style={styles.headerIconsContainer}>
              {dragHandle}
              <Ionicons name="logo-facebook" size={20} color="#4267B2" />
            </View>
          </View>
          <Text style={[styles.socialContent, { color: dark ? COLORS.white : COLORS.black }]}>{post.content}</Text>
          <View style={styles.socialStats}>
            {renderMetaContent()}
          </View>
        </View>
      );
    case 'instagram':
      return (
        <ImageBackground source={{ uri: post.image }} style={[styles.instaImage, activeStyle]}>
          <View style={styles.instaOverlay}>
            <View style={styles.instaTopRight}>
              {dragHandle}
              <TouchableOpacity style={styles.editBackgroundButton} onPress={onEditBackground}>
                <Ionicons name="image-outline" size={16} color={COLORS.white} />
                <Text style={styles.editBackgroundText}>Edit Background</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.instaQuote}>{post.quote}</Text>
            <View style={styles.instaUserContainer}>
              <Image source={{ uri: post.user.avatar }} style={styles.instaAvatar} />
              <View>
                <Text style={styles.instaUsername}>{post.user.name}</Text>
                <Text style={styles.instaUserLocation}>{post.user.location}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      );
    case 'linkedin':
      return (
        <View style={[styles.socialCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }, activeStyle]}>
          <View style={styles.socialHeader}>
            <Image source={{ uri: post.user.avatar }} style={styles.socialAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.socialUser, { color: dark ? COLORS.white : COLORS.black }]}>{post.user.name}</Text>
              <Text style={styles.socialHandle}>{post.user.headline}</Text>
            </View>
            <View style={styles.headerIconsContainer}>
              {dragHandle}
              <Ionicons name="logo-linkedin" size={20} color="#0077b5" />
            </View>
          </View>
          <Text style={[styles.socialContent, { color: dark ? COLORS.white : COLORS.black, fontSize: 14 }]}>{post.content}</Text>
          <View style={styles.socialStats}>
            {renderMetaContent()}
          </View>
        </View>
      );
    default:
      return null;
  }
};

const mockAnalyticsData = {
  overview: {
    totalImpressions: 125600,
    impressionChange: 15.2,
    totalEngagement: 8940,
    engagementChange: 8.5,
    engagementRate: 7.1,
    engagementRateChange: -2.1,
    followersGrowth: 1230,
    followersGrowthChange: 12.3
  },
  platforms: {
    twitter: {
      name: 'X (Twitter)',
      icon: 'close-sharp' as const,
      color: '#000000',
      impressions: 45000,
      engagement: 2500,
      retweets: 600,
      likes: 1800,
      replies: 100,
      engagementHistory: [120, 150, 180, 160, 200, 220, 250],
    },
    facebook: {
      name: 'Facebook',
      icon: 'logo-facebook' as const,
      color: '#4267B2',
      reach: 55000,
      engagement: 4200,
      likes: 3000,
      comments: 800,
      shares: 400,
      engagementHistory: [200, 220, 250, 240, 280, 310, 350],
    },
    instagram: {
      name: 'Instagram',
      icon: 'logo-instagram' as const,
      color: '#E4405F',
      reach: 22000,
      engagement: 1800,
      likes: 1500,
      comments: 250,
      saves: 50,
      engagementHistory: [100, 110, 130, 120, 150, 160, 180],
    },
    linkedin: {
      name: 'LinkedIn',
      icon: 'logo-linkedin' as const,
      color: '#0077b5',
      impressions: 3600,
      engagement: 440,
      likes: 350,
      comments: 80,
      shares: 10,
      engagementHistory: [20, 25, 30, 28, 35, 40, 45],
    }
  }
};

const CircularProgress = ({ size, strokeWidth, progress, color }: { size: number, strokeWidth: number, progress: number, color: string }) => {
  const { dark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dark ? COLORS.dark3 : COLORS.grayscale200}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

const SimpleBarChart = ({ data, color }: { data: number[], color: string }) => {
  const { dark } = useTheme();
  const chartHeight = 100;
  const chartWidth = 200;
  const barWidth = 20;
  const barMargin = 10;
  const maxValue = Math.max(...data);

  return (
    <Svg height={chartHeight} width={chartWidth} >
      {data.map((value, index) => {
        const barHeight = (value / maxValue) * chartHeight * 0.9;
        const x = index * (barWidth + barMargin);
        const y = chartHeight - barHeight;
        return (
          <G key={index}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={4}
            />
            <SvgText
              x={x + barWidth / 2}
              y={y - 5}
              fill={dark ? COLORS.grayscale400 : COLORS.grayscale700}
              fontSize="10"
              textAnchor="middle"
            >
              {value}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

const PlatformAnalyticsCard = ({ platformData }: { platformData: any }) => {
  const { dark } = useTheme();
  return (
    <View style={[styles.platformCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale100 }]}>
      <View style={styles.platformCardHeader}>
        {platformData.icon === 'close-sharp' ? 
          <XLogo size={20} color={dark ? COLORS.white : platformData.color} /> : 
          <Ionicons name={platformData.icon} size={22} color={dark ? COLORS.white : platformData.color} />
        }
        <Text style={[styles.platformCardTitle, { color: dark ? COLORS.white : COLORS.black }]}>{platformData.name}</Text>
      </View>
      <View style={styles.platformCardBody}>
        <View style={styles.platformMetricsContainer}>
            <View style={styles.platformMetricItem}>
              <Text style={[styles.platformMetricValue, { color: dark ? COLORS.white : COLORS.black}]}>{platformData.impressions || platformData.reach}</Text>
              <Text style={styles.platformMetricLabel}>Impressions</Text>
            </View>
            <View style={styles.platformMetricItem}>
              <Text style={[styles.platformMetricValue, { color: dark ? COLORS.white : COLORS.black}]}>{platformData.engagement}</Text>
              <Text style={styles.platformMetricLabel}>Engagement</Text>
            </View>
        </View>
        <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: dark ? COLORS.white : COLORS.black }]}>Engagement Last 7 Days</Text>
            <SimpleBarChart data={platformData.engagementHistory} color={platformData.color} />
        </View>
      </View>
    </View>
  );
};

const AnalyticsRoute = () => {
  const { dark } = useTheme();
  const { overview, platforms } = mockAnalyticsData;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <ScrollView 
      style={styles.analyticsContainer}
      contentContainerStyle={styles.analyticsContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.analyticsSection}>
        <Text style={[styles.analyticsSectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Overall Performance
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContainer}>
          <MetricSliderCard 
            title="Total Impressions"
            value={formatNumber(overview.totalImpressions)}
            change={overview.impressionChange}
            icon="eye-outline"
          />
          <MetricSliderCard 
            title="Engagement Rate"
            value={`${overview.engagementRate.toFixed(1)}%`}
            change={overview.engagementRateChange}
            icon="trending-up-outline"
          >
            <View style={{ alignItems: 'center' }}>
                <CircularProgress size={80} strokeWidth={8} progress={overview.engagementRate * 10} color={COLORS.primary} />
                <Text style={[styles.progressText, { color: dark ? COLORS.white : COLORS.black }]}>{`${overview.engagementRate.toFixed(1)}%`}</Text>
            </View>
          </MetricSliderCard>
          <MetricSliderCard 
            title="Total Engagement"
            value={formatNumber(overview.totalEngagement)}
            change={overview.engagementChange}
            icon="heart-outline"
          />
           <MetricSliderCard 
            title="Followers Growth"
            value={formatNumber(overview.followersGrowth)}
            change={overview.followersGrowthChange}
            icon="people-outline"
          />
        </ScrollView>
      </View>

      <View style={styles.analyticsSection}>
        <Text style={[styles.analyticsSectionTitle, { color: dark ? COLORS.white : COLORS.black }]}>
          Platform Breakdown
        </Text>
        <View style={styles.platformListContainer}>
          {Object.values(platforms).map(platform => (
            <PlatformAnalyticsCard key={platform.name} platformData={platform} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const SocialFeedRoute = ({ platform, dark }: { platform: string, dark: boolean }) => {
  const [scheduledPosts, setScheduledPosts] = useState(() => {
    const posts = mockSocialPosts[platform as keyof typeof mockSocialPosts] || [];
    return posts.map((post, index) => ({
      id: post.id,
      post,
      scheduledAt: new Date(Date.now() + index * 24 * 60 * 60 * 1000), // Schedule posts 1 day apart
    }));
  });
  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{ id: string, date: Date } | null>(null);
  const [isBgModalVisible, setBgModalVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const handleDateChange = useCallback((newDate: Date) => {
    if (selectedPost) {
      const updatedDate = new Date(selectedPost.date);
      updatedDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setScheduledPosts(posts => posts.map(p => p.id === selectedPost.id ? { ...p, scheduledAt: updatedDate } : p));
    }
    setDatePickerVisible(false);
  }, [selectedPost]);

  const handleSelectBackground = useCallback((image: string) => {
    if (editingPostId) {
      setScheduledPosts(posts =>
        posts.map(p =>
          p.id === editingPostId ? { ...p, post: { ...p.post, image } } : p
        )
      );
    }
    setBgModalVisible(false);
    setEditingPostId(null);
  }, [editingPostId]);

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<{id: string, post: any, scheduledAt: Date}>) => {
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.draggableItem,
            {
              backgroundColor: 'transparent',
              zIndex: isActive ? 1000 : 1,
            }
          ]}
        >
          {/* Social Media Post Card with Drag Handle */}
          <SocialPostCard 
            platform={platform.toLowerCase()} 
            post={item.post} 
            dark={dark} 
            onEditBackground={() => {
              setEditingPostId(item.id);
              setBgModalVisible(true);
            }}
            scheduledAt={item.scheduledAt}
            onDatePress={() => {
              setSelectedPost({ id: item.id, date: item.scheduledAt });
              setDatePickerVisible(true);
            }}
            isActive={isActive}
            dragHandle={
              <TouchableOpacity
                onLongPress={drag}
                style={styles.minimalDragHandle}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="reorder-three-outline" 
                  size={16} 
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                />
              </TouchableOpacity>
            }
          />
        </View>
      </ScaleDecorator>
    );
  }, [dark, platform]);

  const handleDragEnd = useCallback(({ data }: { data: any[] }) => {
    const startDate = new Date();
    const reorderedData = data.map((item, index) => {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + index);
      newDate.setHours(item.scheduledAt.getHours(), item.scheduledAt.getMinutes());
      return { ...item, scheduledAt: newDate };
    });
    setScheduledPosts(reorderedData);
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <DraggableFlatList
        data={scheduledPosts}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        containerStyle={Platform.OS === 'web' ? {width: '100%', height: '100%'} : {}}
        autoscrollThreshold={100}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
      {isDatePickerVisible && selectedPost &&
        <CalendarModal
          visible={isDatePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onConfirm={handleDateChange}
          initialDate={selectedPost.date}
        />
      }
      <BackgroundSelectionModal
        visible={isBgModalVisible}
        onClose={() => setBgModalVisible(false)}
        onSelect={handleSelectBackground}
      />
    </View>
  );
};

// ScheduleRoute component has been moved to its own page (app/schedule.tsx)

const PlaceholderRoute = ({ route, dark }: { route: { title: string }, dark: boolean }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="construct-outline" size={48} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
        <Text style={{ marginTop: 16, color: dark ? COLORS.grayscale400 : COLORS.grayscale700, fontSize: 16 }}>
            {route.title} Page Coming Soon
        </Text>
    </View>
);

// Memoized route components to prevent unnecessary re-renders
const MemoizedSermonRoute = React.memo(({ sermonDetails, sermonData, dark }: { sermonDetails: SermonData, sermonData: any, dark: boolean }) => (
  <SermonRoute sermonDetails={sermonDetails} sermonData={sermonData} dark={dark} />
));

const MemoizedSocialFeedRoute = React.memo(({ platform, dark }: { platform: string, dark: boolean }) => (
  <SocialFeedRoute platform={platform} dark={dark} />
));

const MemoizedAnalyticsRoute = React.memo(() => (
  <AnalyticsRoute />
));

const MemoizedPlaceholderRoute = React.memo(({ route, dark }: { route: { title: string }, dark: boolean }) => (
  <PlaceholderRoute route={route} dark={dark} />
));

const SermonDetailsModal: React.FC<SermonDetailsModalProps> = ({
  visible,
  onClose,
  sermonData,
  onSave,
  initialTabIndex = 0,
}) => {
  const { dark } = useTheme();
  
  const [sermonDetails, setSermonDetails] = useState<SermonData>({
    id: '',
    title: '',
    series: '',
    topic: '',
    pastor: '',
    date: new Date().toISOString().split('T')[0],
    keyPoints: [''],
    scripture: [''],
    content: '',
  });
  
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(initialTabIndex);
  const tabBarScrollViewRef = useRef<ScrollView>(null);
  const tabRefs = useRef<any[]>([]);
  const tabPositions = useRef<number[]>([]);
  
  // Memoize routes to prevent recreation on every render
  const routes = useMemo(() => [
    { key: 'sermon', title: 'Sermon', icon: 'book' },
    { key: 'twitter', title: 'X (Twitter)', icon: 'close-sharp' },
    { key: 'facebook', title: 'Facebook', icon: 'logo-facebook' },
    { key: 'instagram', title: 'Instagram', icon: 'logo-instagram' },
    { key: 'linkedin', title: 'LinkedIn', icon: 'logo-linkedin' },
    { key: 'analytics', title: 'Analytics', icon: 'stats-chart' },
  ], []);

  useEffect(() => {
    if (visible) {
      setIndex(initialTabIndex);
    }
  }, [visible, initialTabIndex]);

  useEffect(() => {
    if (visible && tabBarScrollViewRef.current && tabPositions.current[index] !== undefined) {
      // Use requestAnimationFrame for smoother scrolling without delay
      requestAnimationFrame(() => {
        const actualPosition = tabPositions.current[index];
        const scrollPosition = Math.max(0, actualPosition - 20);
        
        // Web-specific optimization: use immediate scroll for better performance
        if (Platform.OS === 'web') {
          tabBarScrollViewRef.current?.scrollTo({ 
            x: scrollPosition, 
            animated: false 
          });
        } else {
          tabBarScrollViewRef.current?.scrollTo({ 
            x: scrollPosition, 
            animated: true 
          });
        }
      });
    }
  }, [index, visible]);

  // Memoize renderScene to prevent recreation on every render
  const renderScene = useMemo(() => {
    return {
      sermon: () => <MemoizedSermonRoute sermonDetails={sermonDetails} sermonData={sermonData} dark={dark} />,
      twitter: () => <MemoizedSocialFeedRoute platform="twitter" dark={dark} />,
      facebook: () => <MemoizedSocialFeedRoute platform="facebook" dark={dark} />,
      instagram: () => <MemoizedSocialFeedRoute platform="instagram" dark={dark} />,
      linkedin: () => <MemoizedSocialFeedRoute platform="linkedin" dark={dark} />,
      analytics: () => <MemoizedAnalyticsRoute />,
    };
  }, [sermonDetails.id, sermonData?.id, dark]); // Only recreate when essential props change

  // Memoize the scene map to prevent recreation
  const sceneMap = useMemo(() => SceneMap(renderScene), [renderScene]);

  // Memoize onIndexChange to prevent unnecessary re-renders
  const handleIndexChange = useCallback((newIndex: number) => {
    setIndex(newIndex);
  }, []);

  const openModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 45,
        friction: 12,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animation values
      overlayOpacity.setValue(0);
      modalAnimation.setValue(0);
      panY.setValue(0);
      onClose();
    });
  };

  const onGestureEvent = (event: any) => {
    const { translationY, state, velocityY } = event.nativeEvent;

    if (state === State.ACTIVE) {
      if (translationY >= 0) {
        panY.setValue(translationY);
      } else {
        panY.setValue(0);
      }
    }

    if (state === State.END) {
      if (translationY > 120 || velocityY > 800) {
        closeModal();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  useEffect(() => {
    if (visible) {
      // Pre-set animation values for instant response
      overlayOpacity.setValue(0);
      modalAnimation.setValue(0);
      
      // Set sermon data immediately
      if (sermonData) {
        setSermonDetails({
          id: sermonData.id || '',
          title: sermonData.title || '',
          series: sermonData.series || '',
          topic: sermonData.topic || '',
          pastor: sermonData.pastor || '',
          date: sermonData.date || new Date().toISOString().split('T')[0],
          keyPoints: sermonData.keyPoints || [''],
          scripture: sermonData.scripture || [''],
          content: sermonData.content || '',
        });
      }
      // Start animation immediately
      openModal();
    }
  }, [visible, sermonData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  
  // Memoize tab bar render function to prevent unnecessary re-renders
  const renderTabBar = useCallback((props: any) => {
    const handleTabPress = useCallback((tabIndex: number) => {
      setIndex(tabIndex);
    }, []);

    return (
      <ScrollView
          ref={tabBarScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
      >
          {props.navigationState.routes.map((route: any, i: number) => {
              const color = index === i ? COLORS.primary : (dark ? COLORS.grayscale400 : COLORS.grayscale700);
              
              return (
                  <TouchableOpacity
                      ref={(el) => { tabRefs.current[i] = el; }}
                      key={route.key}
                      style={styles.tabItem}
                      onPress={() => handleTabPress(i)}
                      activeOpacity={0.7}
                      onLayout={(event) => {
                        const { x } = event.nativeEvent.layout;
                        tabPositions.current[i] = x;
                      }}
                  >
                      {route.key === 'twitter' ? (
                        <XLogo color={color} size={18} />
                      ) : (
                        <Ionicons name={route.icon} size={20} color={color} />
                      )}
                      <Text style={[styles.tabLabel, { color }]}>{route.title}</Text>
                  </TouchableOpacity>
              );
          })}
      </ScrollView>
    );
  }, [index, dark]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
      statusBarTranslucent
      {...(Platform.OS === 'web' && { 
        presentationStyle: 'overFullScreen',
        hardwareAccelerated: true 
      })}
    >
      <Animated.View style={[ styles.overlay, { opacity: overlayOpacity }]} >
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={closeModal} />

        <PanGestureHandler 
          onGestureEvent={onGestureEvent}
          activeOffsetY={[-10, 10]}
          failOffsetX={[-15, 15]}
          shouldCancelWhenOutside={false}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                transform: [
                  {
                    translateY: Animated.add(
                      modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [ Dimensions.get('window').height, 0],
                      }),
                      panY
                    ),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dragHandle}>
              <View style={[styles.dragIndicator, { backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale400 }]} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=pastor' }} style={styles.headerIcon} />
                <View style={styles.headerContent}>
                  <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                    {sermonDetails.title || 'Sermon Details'}
                  </Text>
                  <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                    {sermonDetails.series || 'View sermon information and content'}
                  </Text>
                  <View style={styles.headerMeta}>
                    <Text style={[styles.headerMetaText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                      {sermonDetails.pastor && `${sermonDetails.pastor} • `}
                      {formatDate(sermonDetails.date)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
              </TouchableOpacity>
            </View>

            <TabView
              navigationState={{ index, routes }}
              renderScene={sceneMap}
              onIndexChange={handleIndexChange}
              initialLayout={initialLayout}
              renderTabBar={renderTabBar}
              style={{ flex: 1, paddingBottom: 16 }}
              swipeEnabled={true}
              lazy={false}
              animationEnabled={true}
              {...(Platform.OS === 'web' && { 
                useNativeDriver: false,
                swipeEnabled: false 
              })}
            />
            
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.closeButtonFooter, { backgroundColor: COLORS.primary }]}
                onPress={closeModal}
              >
                <Text style={[styles.closeButtonText, { color: COLORS.white }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 40,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerMetaText: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginLeft: 8,
  },
  infoValue: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'regular',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  closeButtonFooter: {
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'bold',
  },
  topicTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  topicTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  topicTagText: {
    fontSize: 12,
    fontFamily: 'medium',
  },
  topicSectionValue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },
  sourceFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.grayscale100,
  },
  sourceFileText: {
    fontSize: 14,
    flex: 1,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  tabBarContent: {
    paddingHorizontal: SIZES.padding,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  // Social Card Styles
  socialCard: {
    borderRadius: 12,
    padding: 12,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  socialUser: {
    fontWeight: 'bold',
  },
  socialHandle: {
    color: COLORS.grayscale700,
  },
  socialContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  socialTimestamp: {
    color: COLORS.grayscale700,
    fontSize: 12,
    marginTop: 8,
  },
  socialStats: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.grayscale200,
    paddingTop: 8,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialStatItem: {
    color: COLORS.grayscale700,
    fontSize: 12,
  },
  socialStatContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
    alignItems: 'center',
  },
  metaToggle: {
    padding: 4,
  },
  instaImage: {
    height: 350,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBackgroundButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBackgroundText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 4,
  },
  instaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  instaQuote: {
    fontFamily: 'regular',
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 32,
  },
  instaUserContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  instaUsername: {
    fontFamily: 'semiBold',
    fontSize: 14,
    color: COLORS.white,
  },
  instaUserLocation: {
    fontFamily: 'regular',
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
  draggableItem: {
    borderRadius: 12,
    marginBottom: 12,
  },
  dateTouchableMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  scheduledText: {
    fontFamily: 'medium',
    fontSize: 12,
    color: 'rgb(97, 97, 97)',
    flex: 1,
    textDecorationLine: 'underline',
  },
  analyticsContentContainer: {
    paddingVertical: 20,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsSectionTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  progressText: {
    position: 'absolute',
    fontSize: 18,
    fontFamily: 'bold',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -12 }],
  },
  platformListContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  platformCard: {
    borderRadius: 16,
    padding: 16,
  },
  platformCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformCardTitle: {
    fontSize: 18,
    fontFamily: 'bold',
    marginLeft: 8,
  },
  platformCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformMetricsContainer: {
    gap: 16,
  },
  platformMetricItem: {
    alignItems: 'flex-start',
  },
  platformMetricValue: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  platformMetricLabel: {
    fontSize: 12,
    color: COLORS.grayscale700,
    fontFamily: 'regular',
  },
  chartContainer: {
    alignItems: 'flex-end'
  },
  chartTitle: {
    fontSize: 12,
    fontFamily: 'medium',
    marginBottom: 8,
  },
  cardContainer: {
    position: 'relative',
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instaTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalDragHandle: {
    padding: 4,
  },
  postContent: {
    padding: 12,
  },
  // Analytics Styles
  analyticsContainer: {
    flex: 1,
  },
});

export default SermonDetailsModal; 
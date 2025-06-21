import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import XLogo from './XLogo';

interface SermonCardProps {
  sermon: {
    id: string;
    title: string;
    series: string;
    date: string;
    duration: string;
    views: number;
    shares: number;
    image: string;
    status: string;
    bookmarked: boolean;
    progress?: number;
  };
  onPress: () => void;
  onSocialMediaPress?: (platform: string) => void;
}

const SermonCard: React.FC<SermonCardProps> = ({ sermon, onPress, onSocialMediaPress }) => {
  const { dark } = useTheme();

  // Array of colorful colors for book icons
  const bookColors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.tertiary,
    COLORS.success,
    COLORS.warning,
    COLORS.error,
    COLORS.card,
    COLORS.payment,
    COLORS.update,
    COLORS.account,
  ];

  // Generate a consistent color for each sermon based on its ID
  const getBookColor = (sermonId: string) => {
    const hash = sermonId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const index = Math.abs(hash) % bookColors.length;
    return bookColors[index];
  };

  const bookColor = getBookColor(sermon.id);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatShares = (shares: number) => {
    if (shares >= 1000000) {
      return `${(shares / 1000000).toFixed(1)}M`;
    } else if (shares >= 1000) {
      return `${(shares / 1000).toFixed(1)}K`;
    }
    return shares.toString();
  };

  const handleSocialAction = (platform: string) => {
    if (onSocialMediaPress) {
      onSocialMediaPress(platform);
    } else {
      console.log(`Sharing to ${platform}`);
    }
  };

  const handleAnalyticsAction = () => {
    if (onSocialMediaPress) {
      onSocialMediaPress('analytics');
    } else {
      console.log('Opening analytics for sermon');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200 }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.mainContentContainer}>
        <View style={[styles.imageContainer, { backgroundColor: bookColor + '20' }]}>
          <Ionicons 
            name="book" 
            size={40} 
            color={bookColor} 
            style={styles.bookIcon}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]} numberOfLines={2}>
            {sermon.title}
          </Text>
          <Text style={[styles.series, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]} numberOfLines={1}>
            {sermon.series}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Status Badge - Top Right */}
      <View style={[styles.statusBadge, { backgroundColor: sermon.status === 'published' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
        <Ionicons name={sermon.status === 'published' ? 'checkmark-circle' : 'time'} size={10} color={sermon.status === 'published' ? COLORS.success : COLORS.warning} />
        <Text style={[styles.statusText, { color: sermon.status === 'published' ? COLORS.success : COLORS.warning }]}>
          {sermon.status === 'published' ? 'Published' : 'Draft'}
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={14} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
            <Text style={[styles.statText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>{sermon.date}</Text>
          </View>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity style={styles.socialActionButton} onPress={() => handleSocialAction('twitter')}>
              <XLogo color={dark ? COLORS.grayscale400 : COLORS.grayscale700} size={14} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialActionButton} onPress={() => handleSocialAction('facebook')}>
              <Ionicons name="logo-facebook" size={14} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialActionButton} onPress={() => handleSocialAction('instagram')}>
              <Ionicons name="logo-instagram" size={14} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialActionButton} onPress={() => handleSocialAction('linkedin')}>
              <Ionicons name="logo-linkedin" size={14} color={dark ? COLORS.grayscale400 : COLORS.grayscale700} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
        },
        android: {
            elevation: 2,
        }
    }),
  },
  mainContentContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookIcon: {
    // Center the book icon
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 4,
  },
  series: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
  },
  bottomContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'regular',
    marginLeft: 4,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialActionButton: {
    padding: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'medium',
  },
});

export default SermonCard; 
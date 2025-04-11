import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { YouTubeVideo } from '@/lib/youtube';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoCardProps {
  video: YouTubeVideo;
  onPress: (video: YouTubeVideo) => void;
  style?: any;
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

export default function VideoCard({ video, onPress, style }: VideoCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        style,
      ]}
      onPress={() => onPress(video)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />
        <View style={styles.playButton}>
          <Feather name="play" size={24} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={2}
        >
          {video.title}
        </Text>
        
        <View style={styles.channelRow}>
          <Feather name="user" size={14} color={colors.secondaryText} />
          <Text style={[styles.channelText, { color: colors.secondaryText }]}>
            {video.channelTitle}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}>
              {video.publishedAt}
            </Text>
          </View>
          
          {video.viewCount && (
            <View style={styles.metaItem}>
              <Feather name="eye" size={12} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                {parseInt(video.viewCount).toLocaleString()} views
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 6,
  },
}); 
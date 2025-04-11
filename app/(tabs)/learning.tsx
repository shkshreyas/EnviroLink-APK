import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import VideoCard from '@/components/youtube/VideoCard';
import VideoPlayer from '@/components/youtube/VideoPlayer';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  fetchVideosByQuery,
  SUSTAINABILITY_CATEGORIES,
  YouTubeVideo,
} from '@/lib/youtube';

// Check if we have WebView support
let webViewSupported = false;
try {
  require('react-native-webview');
  webViewSupported = true;
} catch (error) {
  console.log('WebView not available, using fallback options');
}

export default function LearningScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(SUSTAINABILITY_CATEGORIES[0]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Header animation based on scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [Platform.OS === 'ios' ? 130 : 110, Platform.OS === 'ios' ? 90 : 70],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Load videos when category changes
  useEffect(() => {
    loadVideos();
    
    // Fade in content animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [selectedCategory]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const results = await fetchVideosByQuery(selectedCategory.query, 15);
      setVideos(results);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const query = `${searchQuery} sustainability`;
      const results = await fetchVideosByQuery(query, 15);
      setVideos(results);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: YouTubeVideo) => {
    if (!webViewSupported) {
      // If WebView is not supported, open directly in YouTube app or browser
      const youtubeAppUrl = `vnd.youtube://${video.id}`;
      const youtubeWebUrl = `https://www.youtube.com/watch?v=${video.id}`;
      
      Linking.canOpenURL(youtubeAppUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(youtubeAppUrl);
          } else {
            return Linking.openURL(youtubeWebUrl);
          }
        })
        .catch(err => {
          console.error('Error opening YouTube link:', err);
          Alert.alert(
            'Cannot Open Video',
            'There was an error opening the video. Please try again later.',
            [{ text: 'OK' }]
          );
        });
    } else {
      // Use the VideoPlayer component if WebView is supported
      setSelectedVideo(video.id);
      setShowPlayer(true);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery('');
    }
  };

  // Custom fallback UI for video player errors
  const videoPlayerFallback = (
    <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Cannot Load Video Player
      </Text>
      <Text style={[styles.errorMessage, { color: colors.secondaryText }]}>
        The video player could not be loaded. Try opening the video directly in YouTube.
      </Text>
      {selectedVideo && (
        <TouchableOpacity
          style={[styles.openYoutubeButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Linking.openURL(`https://www.youtube.com/watch?v=${selectedVideo}`);
            setShowPlayer(false);
          }}
        >
          <Text style={styles.openYoutubeText}>Open in YouTube</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header with gradient */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            opacity: headerOpacity,
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Sustainability Learning
            </Text>
            <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
              <Feather name={isSearching ? 'x' : 'search'} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {isSearching && (
            <Animated.View 
              style={[
                styles.searchBarContainer,
                { opacity: fadeAnim }
              ]}
            >
              <TextInput
                style={styles.searchInput}
                placeholder="Search sustainability topics..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus={true}
              />
              <TouchableOpacity style={styles.searchIconButton} onPress={handleSearch}>
                <Feather name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
      
      {/* Category selector */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {SUSTAINABILITY_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory.id === category.id && [
                  styles.selectedCategory,
                  { backgroundColor: isDark ? colors.primary + '30' : colors.primary + '15' },
                ],
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.text },
                  selectedCategory.id === category.id && { color: colors.primary, fontWeight: 'bold' },
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Video list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Loading sustainability videos...
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })}]
              }}
            >
              <VideoCard video={item} onPress={handleVideoPress} />
            </Animated.View>
          )}
          contentContainerStyle={styles.videoListContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
      
      {/* Video player modal - only shown if WebView is supported */}
      {webViewSupported && (
        <ErrorBoundary fallback={videoPlayerFallback}>
          <VideoPlayer
            videoId={selectedVideo || ''}
            visible={showPlayer}
            onClose={() => setShowPlayer(false)}
          />
        </ErrorBoundary>
      )}

      {/* Optional message if WebView isn't supported */}
      {!webViewSupported && !loading && videos.length > 0 && (
        <View style={styles.webViewMessageContainer}>
          <Text style={[styles.webViewMessage, { color: colors.secondaryText }]}>
            Videos will open in the YouTube app
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  gradientHeader: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchIconButton: {
    padding: 5,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoriesScrollContent: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  selectedCategory: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  videoListContent: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  webViewMessageContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 10,
  },
  webViewMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  openYoutubeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openYoutubeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
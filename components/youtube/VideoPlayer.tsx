import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '@/context/theme';
import { Feather } from '@expo/vector-icons';

// Dynamic import for WebView to handle potential missing dependency
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (error) {
  console.log('WebView not available, using fallback');
}

interface VideoPlayerProps {
  videoId: string;
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function VideoPlayer({ videoId, visible, onClose }: VideoPlayerProps) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  // YouTube embed URL with parameters for clean player
  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&showinfo=0&controls=1`;
  const youtubeAppUrl = `vnd.youtube://${videoId}`;
  const youtubeWebUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const openYoutubeLink = () => {
    Linking.canOpenURL(youtubeAppUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(youtubeAppUrl);
        } else {
          return Linking.openURL(youtubeWebUrl);
        }
      })
      .catch(err => console.error('Error opening YouTube link:', err));
    
    onClose();
  };

  const renderFallbackView = () => (
    <View style={styles.fallbackContainer}>
      <Text style={[styles.fallbackText, { color: colors.text }]}>
        WebView not available
      </Text>
      <TouchableOpacity
        style={[styles.openButton, { backgroundColor: colors.primary }]}
        onPress={openYoutubeLink}
      >
        <Text style={styles.openButtonText}>Open in YouTube</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.videoContainer, { backgroundColor: colors.card }]}>
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {WebView ? (
            <>
              <WebView
                source={{ uri: youtubeUrl }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </>
          ) : renderFallbackView()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  videoContainer: {
    width: width * 0.9,
    height: height * 0.4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  openButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
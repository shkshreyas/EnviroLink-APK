import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { X, Image as ImageIcon, Camera as CameraIcon } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { analyzeSustainabilityImage } from '@/lib/energy/cameraAnalysis';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type CameraSustainabilityAnalysisProps = {
  visible: boolean;
  onClose: () => void;
};

export const CameraSustainabilityAnalysis = ({ visible, onClose }: CameraSustainabilityAnalysisProps) => {
  const { colors, isDark } = useTheme();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  
  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ scale: scaleAnim.value }],
    };
  });

  useEffect(() => {
    // Animate in when component mounts
    fadeAnim.value = withTiming(1, { duration: 300, easing: Easing.ease });
    scaleAnim.value = withTiming(1, { duration: 300, easing: Easing.ease });
    
    // Request camera permissions
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Camera access is needed for the sustainability scanner',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const openCamera = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission required',
        'Camera access is needed for the sustainability scanner',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Launch the camera directly
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzeImage = async (uri: string) => {
    setIsLoading(true);
    setAnalysisResult(null);
    
    try {
      const analysis = await analyzeSustainabilityImage(uri);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCamera = () => {
    setImageUri(null);
    setAnalysisResult(null);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Animated.View style={[
        styles.container, 
        { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
        animatedContainerStyle
      ]}>
        <TouchableOpacity 
          style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]} 
          onPress={onClose}
        >
          <X size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        
        {imageUri ? (
          <View style={styles.resultContainer}>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.analysisCard}
            >
              <Text style={[styles.analysisTitle, { color: colors.text }]}>
                Sustainability Analysis
              </Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
                  <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Analyzing your image...
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.analysisContent}>
                  <Text style={[styles.analysisText, { color: colors.text }]}>
                    {analysisResult}
                  </Text>
                </ScrollView>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}
                onPress={resetCamera}
              >
                <Text style={styles.buttonText}>Scan Another</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <CameraIcon size={80} color={isDark ? '#3B82F6' : '#2563EB'} />
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Take a photo or choose from gallery
            </Text>
          </View>
        )}
        
        {!imageUri && (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}
              onPress={openCamera}
            >
              <Text style={styles.buttonText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isDark ? '#3B82F6' : '#2563EB' }]}
              onPress={pickImage}
            >
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!imageUri && (
          <Text style={[styles.helperText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Take a photo or select an image to get sustainability insights
          </Text>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    width: '100%',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '40%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  analysisCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  analysisContent: {
    flex: 1,
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default CameraSustainabilityAnalysis;
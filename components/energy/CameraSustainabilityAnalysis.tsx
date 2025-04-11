import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/theme';
import { analyzeSustainabilityImage } from '@/lib/energy/cameraAnalysis';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Leaf,
  Users,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraSustainabilityAnalysisProps {
  onClose: () => void;
  visible: boolean;
}

export default function CameraSustainabilityAnalysis({
  onClose,
  visible,
}: CameraSustainabilityAnalysisProps) {
  const { colors, isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Also request media library permissions for picking images
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryStatus.status !== 'granted') {
        console.log('Media library permission not granted');
      }
    })();
  }, []);

  useEffect(() => {
    // Reset state when modal is opened
    if (visible) {
      setCapturedImage(null);
      setAnalysisResult(null);
      setShowCamera(true);
      setAnalyzing(false);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Start rotation animation for the refresh icon
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      setCapturedImage(photo.uri);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setAnalyzing(true);
    
    try {
      const result = await analyzeSustainabilityImage(capturedImage);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisResult('An error occurred during analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setShowCamera(true);
  };

  const renderCameraView = () => {
    if (hasPermission === null) {
      return (
        <View style={[styles.cameraContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Requesting camera permission...
          </Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={[styles.cameraContainer, { backgroundColor: colors.card }]}>
          <AlertTriangle size={40} color={colors.error} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Camera access denied. Please enable camera permissions in your device settings.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={pickImage}
          >
            <ImageIcon size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="4:3"
        >
          <View style={styles.cameraOverlay}>
            <Animated.View 
              style={[styles.cameraFrame, { 
                borderColor: colors.primary,
                transform: [{ scale: pulseAnim }] 
              }]}
            />
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => onClose()}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={pickImage}
              >
                <ImageIcon size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  };

  const renderImagePreview = () => {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: colors.error }]}
            onPress={resetCamera}
          >
            <X size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: colors.primary }]}
            onPress={analyzeImage}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.buttonText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Lightbulb size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Analyze</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    return (
      <Animated.View 
        style={[styles.analysisContainer, { 
          backgroundColor: colors.card,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}
      >
        <View style={styles.analysisHeader}>
          <View style={styles.analysisIconContainer}>
            <LinearGradient
              colors={isDark ? ['#0F172A', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.analysisIconGradient}
            >
              <View style={[styles.analysisIcon, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
                <Leaf size={24} color="#22C55E" />
              </View>
            </LinearGradient>
          </View>
          
          <Text style={[styles.analysisTitle, { color: colors.text }]}>
            Sustainability Analysis
          </Text>
        </View>
        
        <ScrollView style={styles.analysisContent}>
          <Text style={[styles.analysisText, { color: colors.text }]}>
            {analysisResult}
          </Text>
        </ScrollView>
        
        <View style={styles.analysisFooter}>
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={resetCamera}
          >
            <RefreshCw size={18} color={colors.primary} />
            <Text style={[styles.footerButtonText, { color: colors.primary }]}>New Analysis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <CheckCircle size={18} color="#FFFFFF" />
            <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        
        {!analysisResult && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Sustainability Scanner
            </Text>
          </View>
        )}
        
        {showCamera && renderCameraView()}
        {capturedImage && !analysisResult && renderImagePreview()}
        {analysisResult && renderAnalysisResult()}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderWidth: 2,
    borderRadius: 20,
    marginTop: 80,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  analysisContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  analysisHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  analysisIconContainer: {
    marginBottom: 16,
  },
  analysisIconGradient: {
    padding: 12,
    borderRadius: 20,
  },
  analysisIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  analysisContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
  },
  analysisFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  footerButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
});
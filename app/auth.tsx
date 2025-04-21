import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { Leaf, X, ArrowRight, Lock, Mail, User, CheckCircle } from 'lucide-react-native';
import { checkNetworkConnectivity } from '@/lib/network';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing,
  withDelay,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const rotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Logo animation styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  // Text animation style
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        logoOpacity.value,
        [0, 0.7, 1],
        [0, 0.5, 1],
        Extrapolate.CLAMP
      ),
      transform: [{ translateY: interpolate(
        logoOpacity.value,
        [0, 1],
        [20, 0],
        Extrapolate.CLAMP
      )}],
    };
  });

  // Form animation style
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  // Start animations when component mounts
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, { damping: 12 });
    
    formOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(400, withSpring(0, { damping: 14 }));
    
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000 }),
        withTiming(5, { duration: 1000 }),
        withTiming(0, { duration: 500 })
      ), 
      -1, // infinite repeats
      true // reverse
    );
    
    // Delayed text fade in
    textOpacity.value = withDelay(300, withTiming(1, { 
      duration: 800, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error(
          'Network connection failed. Please check your internet connection and try again.'
        );
      }

      if (isLogin) {
        console.log('Attempting to sign in with:', email);
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Sign in error:', error.message);
          throw error;
        }
        console.log('Sign in successful');
      } else {
        if (!name) {
          setError('Name is required');
          setLoading(false);
          return;
        }

        console.log('Attempting to sign up with:', email);
        const { error } = await signUp(email, password, name);
        if (error) {
          console.error('Sign up error:', error.message);
          throw error;
        }

        setIsLogin(true);
        setError(
          'Account created! Please check your email to confirm your account, then log in.'
        );
      }
    } catch (err) {
      console.error('Auth error:', err);

      // More specific error handling
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          setError(
            'Network error. Please check your internet connection and try again.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error(
          'Network connection failed. Please check your internet connection and try again.'
        );
      }

      const { error } = await resetPassword(resetEmail);
      if (error) {
        throw error;
      }

      setResetEmailSent(true);
    } catch (err) {
      console.error('Password reset error:', err);

      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert(
          'Error',
          'An unknown error occurred. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const openResetPasswordModal = () => {
    setResetEmail(email); // Pre-fill with the email if already entered
    setResetEmailSent(false);
    setShowResetModal(true);
  };

  const closeResetPasswordModal = () => {
    setShowResetModal(false);
    setResetEmailSent(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error(
          'Network connection failed. Please check your internet connection and try again.'
        );
      }
      
      console.log('Attempting to sign in with Google');
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign in error:', error.message);
        throw error;
      }
      console.log('Google sign in initiated');
    } catch (err) {
      console.error('Google auth error:', err);
      
      // Error handling
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          setError(
            'Network error. Please check your internet connection and try again.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#121212', '#1E293B', '#0F172A']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoBackground, logoAnimatedStyle]}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.logoInner}>
                  <View style={[styles.logoElement, styles.logoElement1]} />
                  <View style={[styles.logoElement, styles.logoElement2]} />
                  <View style={[styles.logoElement, styles.logoElement3]} />
                </View>
              </LinearGradient>
            </Animated.View>
            <Animated.Text style={[styles.appTitle, textAnimatedStyle]}>
              EnviroLink
            </Animated.Text>
            <Animated.Text style={[styles.appSubtitle, textAnimatedStyle]}>
              Connect with Sustainable Solutions
            </Animated.Text>
          </View>

          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <BlurView intensity={20} style={styles.formBlur} tint="dark">
              <Text style={styles.formTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isLogin
                  ? 'Sign in to continue your sustainable journey'
                  : 'Join our community of environmental champions'}
              </Text>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputIconContainer}>
                    <User size={18} color="#8B5CF6" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.inputIconContainer}>
                  <Mail size={18} color="#8B5CF6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIconContainer}>
                  <Lock size={18} color="#8B5CF6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={openResetPasswordModal}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.actionButtonText}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Google Sign In Button */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconContainer}>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                </View>
                <Text style={styles.googleButtonText}>
                  {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                </Text>
              </TouchableOpacity>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.switchActionText}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          <View style={styles.resourcesBox}>
            <LinearGradient
              colors={['rgba(79, 70, 229, 0.2)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.resourcesGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.resourcesTitle}>
                Sustainable Development Resources
              </Text>
              <Text style={styles.resourcesText}>
                Explore our curated resources about sustainable living, renewable
                energy, conservation efforts, and how you can make a difference in
                your community.
              </Text>
              <TouchableOpacity 
                style={styles.resourcesButton}
                activeOpacity={0.8}
              >
                <Text style={styles.resourcesButtonText}>Explore Resources</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* Forgot Password Modal */}
        <Modal
          visible={showResetModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeResetPasswordModal}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={80} style={styles.modalBlur} tint="dark">
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeResetPasswordModal}
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>

                {resetEmailSent ? (
                  <View style={styles.successContainer}>
                    <CheckCircle size={60} color="#8B5CF6" />
                    <Text style={styles.modalTitle}>Email Sent</Text>
                    <Text style={styles.successText}>
                      Password reset instructions have been sent to your email
                      address. Please check your inbox and follow the instructions
                      to reset your password.
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={closeResetPasswordModal}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#6366F1']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.modalButtonText}>Return to Login</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Reset Password</Text>
                    <Text style={styles.modalDescription}>
                      Enter your email address and we'll send you instructions to
                      reset your password.
                    </Text>
                    <View style={styles.inputIconContainer}>
                      <Mail size={18} color="#8B5CF6" style={styles.inputIcon} />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Email Address"
                        placeholderTextColor="#94A3B8"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleForgotPassword}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#6366F1']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.modalButtonText}>Send Reset Link</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </BlurView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  logoElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  logoElement1: {
    width: 40,
    height: 40,
    top: 20,
    left: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ rotate: '15deg' }],
  },
  logoElement2: {
    width: 30,
    height: 30,
    top: 35,
    left: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 15,
    transform: [{ rotate: '45deg' }],
  },
  logoElement3: {
    width: 25,
    height: 25,
    top: 42,
    left: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderRadius: 12.5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  formBlur: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#94A3B8',
    fontSize: 14,
    marginRight: 4,
  },
  switchActionText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  resourcesBox: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  resourcesGradient: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resourcesText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  resourcesButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  resourcesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modalBlur: {
    width: width > 500 ? 450 : width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
  },
  modalButton: {
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successText: {
    color: '#94A3B8',
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
    padding: 12,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

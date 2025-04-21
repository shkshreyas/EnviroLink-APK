import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Leaf,
  RefreshCw,
  ChevronDown,
  HelpCircle,
  WifiOff,
} from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import {
  generateSustainabilityResponse,
  getRandomSustainabilityQuestions,
} from '@/lib/gemini';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hello! I'm your EnviroLink sustainability assistant powered by Gemini. How can I help you with environmental sustainability today?",
    sender: 'bot',
    timestamp: new Date(),
  },
];

export default function ChatbotModal() {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);
  const lastMessageRef = useRef<string>('');

  // Handle button press
  const openModal = () => {
    setModalVisible(true);
  };

  // Handle close button
  const closeModal = () => {
    setModalVisible(false);
  };

  // Periodic network check - simplified and less frequent
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    // Check connectivity much less frequently to reduce overhead
    checkConnectivity();
    const intervalId = setInterval(checkConnectivity, 60000); // Once per minute

    return () => clearInterval(intervalId);
  }, []);

  // Load suggestions when the component mounts
  useEffect(() => {
    setSuggestions(getRandomSustainabilityQuestions(3));
  }, []);

  // Reset suggestions when the modal is closed
  useEffect(() => {
    if (!modalVisible) {
      setSuggestions(getRandomSustainabilityQuestions(3));
    }
  }, [modalVisible]);

  // Animate the button when not in use
  useEffect(() => {
    // Simple animation for the button
    const pulseAnimation = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      ),
      -1,
      true
    );
    
    const glowAnimation = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 }),
      ),
      -1,
      true
    );

    if (!modalVisible) {
      buttonScale.value = pulseAnimation;
      buttonGlow.value = glowAnimation;
    } else {
      buttonScale.value = withTiming(1);
      buttonGlow.value = withTiming(0);
    }
  }, [modalVisible, buttonScale, buttonGlow]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      shadowOpacity: buttonGlow.value,
    };
  });

  const handleSend = () => {
    if (input.trim() === '') return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    handleBotResponse(input);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };
  
  const handleBotResponse = async (userInput: string) => {
    if (!userInput.trim()) return;

    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'You appear to be offline. Connect to the internet to use the chatbot.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Save for potential retry
    lastMessageRef.current = userInput.trim();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userInput.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get response from Gemini
      let response = await generateSustainabilityResponse(userInput.trim());
      
      // Remove markdown formatting
      response = cleanMarkdownFromText(response);

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Update suggestions after each successful exchange
      setSuggestions(getRandomSustainabilityQuestions(3));
    } catch (error) {
      console.error('Error getting response:', error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting to my knowledge base. Please check your internet connection and try again.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to clean markdown from text
  const cleanMarkdownFromText = (text: string): string => {
    // Replace markdown headings
    let cleanText = text.replace(/#+\s+(.+)/g, '$1');
    
    // Replace bold text
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // Replace italic text
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    
    // Replace backticks/code blocks
    cleanText = cleanText.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, '').trim();
    });
    
    // Replace inline code
    cleanText = cleanText.replace(/`(.+?)`/g, '$1');
    
    // Replace bullet points
    cleanText = cleanText.replace(/[-*]\s+(.+)/g, '• $1');
    
    // Remove extra line breaks
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    
    return cleanText;
  };

  const handleRetry = () => {
    if (lastMessageRef.current) {
      // Remove the error message
      setMessages((prev) => prev.filter((msg) => !msg.isError));
      // Retry the last query
      handleBotResponse(lastMessageRef.current);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === 'bot';
    const isErrorMessage = item.isError;

    return (
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isBot
              ? isErrorMessage
                ? isDark
                  ? 'rgba(220, 38, 38, 0.2)'
                  : '#FEE2E2'
                : isDark
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(243, 244, 246, 0.8)'
              : isDark 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(16, 185, 129, 0.15)',
            alignSelf: isBot ? 'flex-start' : 'flex-end',
            borderWidth: 1,
            borderColor: isBot
              ? isErrorMessage
                ? isDark
                  ? 'rgba(220, 38, 38, 0.3)'
                  : 'rgba(220, 38, 38, 0.2)'
                : isDark
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(59, 130, 246, 0.2)'
              : isDark
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(16, 185, 129, 0.2)',
          },
        ]}
      >
        {isBot && (
          <View style={styles.botIconContainer}>
            <Leaf
              size={16}
              color={isErrorMessage ? '#DC2626' : isDark ? '#60A5FA' : '#3B82F6'}
            />
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            {
              color: isBot
                ? isErrorMessage
                  ? isDark
                    ? '#FCA5A5'
                    : '#B91C1C'
                  : colors.text
                : colors.text,
            },
          ]}
        >
          {item.text}
        </Text>

        {isErrorMessage && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(254, 226, 226, 0.8)',
              },
            ]}
            onPress={handleRetry}
          >
            <RefreshCw size={14} color={isDark ? '#FCA5A5' : '#DC2626'} />
            <Text
              style={{
                color: isDark ? '#FCA5A5' : '#DC2626',
                marginLeft: 4,
                fontSize: 12,
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        )}

        <Text
          style={[
            styles.timestamp,
            {
              color: isBot 
                ? isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(100, 116, 139, 0.8)'
                : isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(100, 116, 139, 0.8)',
            },
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderSuggestions = () => {
    // Only return null if there are no suggestions, don't check messages.length
    if (suggestions.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 41, 59, 0.7)'
                    : 'rgba(241, 245, 249, 0.8)',
                  borderColor: isDark
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(203, 213, 225, 0.8)',
                },
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.suggestionText,
                  { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Animated.View style={[
        styles.floatingButton,
        buttonAnimatedStyle,
        {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          shadowColor: colors.primary,
        }
      ]}>
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <MessageSquare size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      {modalVisible && (
        <View style={styles.modalBackdrop}>
          <BlurView 
            intensity={90}
            tint={isDark ? "dark" : "light"}
            style={styles.blurContainer}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(15, 23, 42, 0.9)', 'rgba(30, 41, 59, 0.9)']
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(241, 245, 249, 0.9)']
              }
              style={styles.gradientModal}
            >
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={isDark 
                    ? ['#3B82F6', '#60A5FA'] 
                    : ['#3B82F6', '#60A5FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerGradient}
                >
                  <View style={styles.headerContent}>
                    <View style={styles.headerTitleContainer}>
                      <Sparkles size={18} color="#FFFFFF" />
                      <Text style={styles.headerTitle}>EnviroLink Assistant</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <ChevronDown size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                <View style={styles.chatContainer}>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContainer}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    inverted={false}
                    ListHeaderComponent={messages.length > 0 ? null : renderSuggestions}
                    ListFooterComponent={messages.length > 0 ? renderSuggestions : null}
                    style={styles.flatList}
                    onLayout={() => {
                      if (flatListRef.current && messages.length > 0) {
                        flatListRef.current.scrollToEnd({ animated: false });
                      }
                    }}
                  />
    
                  {!isConnected && (
                    <View
                      style={[
                        styles.offlineBar,
                        {
                          backgroundColor: isDark
                            ? 'rgba(220, 38, 38, 0.2)'
                            : 'rgba(254, 226, 226, 0.8)',
                          borderColor: isDark
                            ? 'rgba(220, 38, 38, 0.3)'
                            : 'rgba(220, 38, 38, 0.2)',
                        },
                      ]}
                    >
                      <WifiOff size={20} color={isDark ? '#FCA5A5' : '#DC2626'} />
                      <Text style={{ color: isDark ? '#FCA5A5' : '#DC2626', marginLeft: 8 }}>
                        No internet connection
                      </Text>
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <TextInput
                        ref={inputRef}
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark
                              ? 'rgba(30, 41, 59, 0.7)'
                              : 'rgba(241, 245, 249, 0.8)',
                            color: colors.text,
                            borderColor: isDark
                              ? 'rgba(51, 65, 85, 0.5)'
                              : 'rgba(203, 213, 225, 0.8)',
                          },
                        ]}
                        placeholder="Ask about sustainability..."
                        placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        editable={!isTyping && isConnected}
                        multiline
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          {
                            backgroundColor: input.trim() && !isTyping && isConnected
                              ? colors.primary
                              : isDark
                                ? 'rgba(51, 65, 85, 0.7)'
                                : 'rgba(203, 213, 225, 0.8)',
                          },
                        ]}
                        onPress={handleSend}
                        disabled={!input.trim() || isTyping || !isConnected}
                        activeOpacity={0.7}
                      >
                        <Send
                          size={18}
                          color={
                            input.trim() && !isTyping && isConnected
                              ? '#FFFFFF'
                              : isDark
                                ? '#94A3B8'
                                : '#64748B'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </LinearGradient>
          </BlurView>
        </View>
      )}
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
    zIndex: 9999,
    borderRadius: 30,
    padding: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.3,
    elevation: 8,
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradientModal: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  botIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    maxWidth: '70%',
    borderWidth: 1,
  },
  typingIndicator: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
    marginRight: 3,
    opacity: 0.6,
  },
  loadingText: {
    marginLeft: 2,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    padding: 12,
    marginRight: 8,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    paddingTop: 8,
    width: '100%',
  },
  suggestionsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    maxWidth: width * 0.7,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  offlineBar: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputWrapper: {
    width: '100%',
  },
  inputTouchableArea: {
    width: '100%',
  },
  flatList: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
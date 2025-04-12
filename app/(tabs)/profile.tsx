import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, User, Bell, Moon, Leaf, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, setTheme } = useTheme();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(isDark);
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);

  useEffect(() => {
    // Update theme when darkMode switch changes
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    router.replace('/auth');
    return null;
  }

  // Get user's name from email if full name isn't available
  const userName = user.email ? user.email.split('@')[0] : 'User';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={[colors.profileGradientStart, colors.profileGradientEnd]}
        style={styles.profileHeader}
      >
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileImageContainer}>
            {/* You can replace this with an actual profile image */}
            <View style={[styles.profileImage, { backgroundColor: colors.avatarBackground }]}>
              <User size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.profileName}>{user.user_metadata?.full_name || userName}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            {/* Dark Mode Toggle */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(125, 211, 252, 0.2)' : '#F0F9FF' }]}>
                <Moon size={20} color="#0EA5E9" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                thumbColor={Platform.OS === 'android' ? (darkMode ? colors.primary : '#F4F4F5') : ''}
                trackColor={{ false: '#E4E4E7', true: colors.primary + '70' }}
                ios_backgroundColor="#E4E4E7"
              />
            </View>

            {/* Notifications Toggle */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FFFBEB' }]}>
                <Bell size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                thumbColor={Platform.OS === 'android' ? (notifications ? colors.primary : '#F4F4F5') : ''}
                trackColor={{ false: '#E4E4E7', true: colors.primary + '70' }}
                ios_backgroundColor="#E4E4E7"
              />
            </View>

            {/* Data Sharing Toggle */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#ECFDF5' }]}>
                <Leaf size={20} color="#10B981" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Data Sharing</Text>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                thumbColor={Platform.OS === 'android' ? (dataSharing ? colors.primary : '#F4F4F5') : ''}
                trackColor={{ false: '#E4E4E7', true: colors.primary + '70' }}
                ios_backgroundColor="#E4E4E7"
              />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
            {/* Edit Profile */}
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }]}>
                <User size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Profile</Text>
              <ChevronRight size={20} color={colors.secondaryText} />
            </TouchableOpacity>

            {/* App Settings */}
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                <Settings size={20} color="#6366F1" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>App Settings</Text>
              <ChevronRight size={20} color={colors.secondaryText} />
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSignOut}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Sign Out</Text>
              <ChevronRight size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.secondaryText }]}>EnviroLink v1.0.0</Text>
          <Text style={[styles.appCopyright, { color: colors.secondaryText }]}>© 2025 SustainLab</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  appInfo: {
    marginVertical: 30,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
}); 
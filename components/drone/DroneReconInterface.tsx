import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Battery,
  Wifi,
  AlarmClock,
} from 'lucide-react-native';
import { useTheme } from '@/context/theme';

// Simplified drone interface with only essential elements
export default function DroneReconInterface() {
  const { colors, isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState('dashboard');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Drone Recon System
          </Text>
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>PROTOTYPE</Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
          Environmental Monitoring System
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.droneBanner}>
          <Image
            source={require('@/assets/images/drone.png')}
            style={styles.droneImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.droneStatus,
              {
                backgroundColor: isDark
                  ? 'rgba(0,0,0,0.7)'
                  : 'rgba(255,255,255,0.8)',
              },
            ]}
          >
            <Text style={[styles.droneStatusText, { color: colors.primary }]}>
              EnviroLink Forestry Drone
            </Text>
            <View style={styles.statusIndicator}>
              <View
                style={[styles.statusDot, { backgroundColor: '#10B981' }]}
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Prototype Ready
              </Text>
            </View>
          </View>
        </View>

        {/* Simplified tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'dashboard' && [
                styles.selectedTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedTab('dashboard')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'dashboard' && { color: colors.primary },
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'missions' && [
                styles.selectedTab,
                { borderColor: colors.primary },
              ],
            ]}
            onPress={() => setSelectedTab('missions')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'missions' && { color: colors.primary },
              ]}
            >
              Missions
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'dashboard' && (
          <View style={styles.dashboardContainer}>
            <View
              style={[styles.statsContainer, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Drone Status
              </Text>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Battery size={20} color={colors.primary} />
                  <Text
                    style={[styles.statLabel, { color: colors.secondaryText }]}
                  >
                    Battery
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    92%
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Wifi size={20} color={colors.primary} />
                  <Text
                    style={[styles.statLabel, { color: colors.secondaryText }]}
                  >
                    Signal
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    Strong
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <AlarmClock size={20} color={colors.primary} />
                  <Text
                    style={[styles.statLabel, { color: colors.secondaryText }]}
                  >
                    Flight Time
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    24 min
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.infoCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                About This Interface
              </Text>
              <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                This is a prototype demonstration of the EnviroLink Drone Monitoring System. The interface shows how drone data would be presented in a real deployment.
              </Text>
            </View>
          </View>
        )}

        {selectedTab === 'missions' && (
          <View style={styles.missionsContainer}>
            <View
              style={[styles.missionCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.missionTitle, { color: colors.text }]}>
                Sample Mission
              </Text>
              <Text style={[styles.missionDescription, { color: colors.secondaryText }]}>
                This is a sample forest monitoring mission that would be available in the full version.
              </Text>
              <TouchableOpacity
                style={[styles.missionButton, { backgroundColor: colors.primary }]}
                onPress={() => {}}
              >
                <Text style={styles.missionButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  betaTag: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  betaText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  droneBanner: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  droneImage: {
    width: '100%',
    height: '100%',
  },
  droneStatus: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    borderRadius: 8,
    padding: 10,
  },
  droneStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  dashboardContainer: {
    padding: 16,
  },
  statsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  missionsContainer: {
    padding: 16,
  },
  missionCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  missionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  missionButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  missionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

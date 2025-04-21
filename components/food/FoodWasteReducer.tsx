import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  Modal,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import {
  Plus,
  Clock,
  Trash2,
  Calendar,
  ChevronRight,
  Search,
  Check,
  AlertTriangle,
  UtensilsCrossed,
  ShoppingCart,
  BarChart,
  X,
  Leaf,
  ArrowLeft,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateRecipes, RecipeSuggestion } from '@/lib/food/recipeGenerator';

// Types for food items
interface FoodItem {
  id: string;
  name: string;
  expiryDate: Date;
  quantity: string;
  category: FoodCategory;
  imageUrl?: string;
  notes?: string;
}

type FoodCategory = 
  | 'fruits' 
  | 'vegetables' 
  | 'dairy' 
  | 'meat' 
  | 'grains' 
  | 'other';

const CATEGORY_COLORS = {
  fruits: '#22C55E',
  vegetables: '#10B981',
  dairy: '#3B82F6',
  meat: '#EF4444',
  grains: '#F59E0B',
  other: '#8B5CF6',
};

export const FoodWasteReducer = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  // State for food inventory
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: '1',
      name: 'Apples',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      quantity: '6',
      category: 'fruits',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
    },
    {
      id: '2',
      name: 'Spinach',
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      quantity: '1 bag',
      category: 'vegetables',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
    },
    {
      id: '3',
      name: 'Milk',
      expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      quantity: '1 gallon',
      category: 'dairy',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
    },
    {
      id: '4',
      name: 'Chicken Breast',
      expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      quantity: '2 lbs',
      category: 'meat',
      imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
    },
    {
      id: '5',
      name: 'Rice',
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      quantity: '2 lbs',
      category: 'grains',
      imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6',
    },
  ]);
  
  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [statistics, setStatistics] = useState({
    expiringSoon: 0,
    savedThisMonth: 2.4, // kg of food
    co2Saved: 6.7, // kg of CO2
  });
  
  // New item form state
  const [newItem, setNewItem] = useState<Partial<FoodItem>>({
    name: '',
    quantity: '',
    category: 'other',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
  });

  // Calculate expiring soon items
  useEffect(() => {
    // Count items expiring in the next 3 days
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = foodItems.filter(item => item.expiryDate <= threeDaysFromNow).length;
    
    setStatistics(prev => ({
      ...prev,
      expiringSoon: expiringSoonCount
    }));
    
  }, [foodItems]);

  // Filter food items by search query
  const filteredItems = foodItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort items by expiry date (soonest first)
  const sortedItems = [...filteredItems].sort((a, b) => 
    a.expiryDate.getTime() - b.expiryDate.getTime()
  );

  // Add a new food item
  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity) {
      Alert.alert('Missing Information', 'Please enter all required fields');
      return;
    }
    
    const item: FoodItem = {
      id: Date.now().toString(),
      name: newItem.name!,
      quantity: newItem.quantity!,
      category: newItem.category || 'other',
      expiryDate: newItem.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: newItem.notes,
    };
    
    setFoodItems(prev => [...prev, item]);
    setAddModalVisible(false);
    setNewItem({
      name: '',
      quantity: '',
      category: 'other',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  };

  // Remove a food item
  const handleRemoveItem = (id: string) => {
    Alert.alert(
      'Confirm Removal',
      'Did you use this item or did it go to waste?',
      [
        {
          text: 'Used It',
          onPress: () => {
            setFoodItems(prev => prev.filter(item => item.id !== id));
            // Update statistics - increase saved food
            setStatistics(prev => ({
              ...prev,
              savedThisMonth: parseFloat((prev.savedThisMonth + 0.3).toFixed(1)),
              co2Saved: parseFloat((prev.co2Saved + 0.8).toFixed(1)),
            }));
          },
        },
        {
          text: 'Wasted',
          onPress: () => {
            setFoodItems(prev => prev.filter(item => item.id !== id));
            // No statistics update for wasted food
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Generate recipe suggestions based on expiring ingredients
  const handleGenerateRecipes = async () => {
    const expiringItems = foodItems
      .filter(item => getDaysUntilExpiry(item.expiryDate) <= 5)
      .map(item => item.name);
    
    if (expiringItems.length === 0) {
      Alert.alert('No Items Expiring Soon', 'There are no items expiring soon to generate recipes for.');
      return;
    }
    
    try {
      const recipes = await generateRecipes(expiringItems);
      setRecipeSuggestions(recipes);
      setRecipeModalVisible(true);
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Error', 'Failed to generate recipe suggestions. Please try again.');
    }
  };

  // Get days until expiry for display
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get color based on expiry days
  const getExpiryColor = (expiryDate: Date) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry <= 0) return '#EF4444'; // Expired - Red
    if (daysUntilExpiry <= 3) return '#F59E0B'; // Soon - Amber
    return '#22C55E'; // Good - Green
  };

  // Render a food item card
  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const expiryColor = getExpiryColor(item.expiryDate);
    
    return (
      <View style={cardStyle}>
        <View style={styles.foodItemContent}>
          <View style={[
            styles.categoryIndicator,
            { backgroundColor: CATEGORY_COLORS[item.category] }
          ]} />
          
          <View style={styles.foodItemDetails}>
            <Text style={[
              styles.foodItemName,
              { color: colors.text }
            ]}>
              {item.name}
            </Text>
            
            <Text style={[
              styles.foodItemQuantity,
              { color: colors.text }
            ]}>
              {item.quantity}
            </Text>
            
            <View style={styles.expiryRow}>
              <Calendar size={14} color={expiryColor} />
              <Text style={[
                styles.expiryText,
                { color: expiryColor }
              ]}>
                {daysUntilExpiry <= 0
                  ? 'Expired'
                  : daysUntilExpiry === 1
                    ? 'Expires tomorrow'
                    : `Expires in ${daysUntilExpiry} days`
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Trash2 size={18} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Add UI improvements and fix shadow styling
  const cardStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 3,
    }),
  };
  
  const buttonStyle = {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center' as const,
    marginTop: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {
      elevation: 2,
    }),
  };
  
  const buttonTextStyle = {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[
              styles.backButton, 
              { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Food Waste
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Track your food to reduce waste
            </Text>
          </View>
        </View>
      </View>
      
      {/* Food Waste Stats Card */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#F1F5F9', '#E2E8F0']}
        style={styles.statsCard}
      >
        <View style={styles.statsCardContent}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertTriangle size={18} color="#EF4444" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.expiringSoon}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Expiring Soon
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }]}>
              <Leaf size={18} color="#22C55E" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.savedThisMonth} kg
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Food Saved
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <BarChart size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.co2Saved} kg
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              CO₂ Saved
            </Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[cardStyle, styles.actionButton]}
          onPress={handleGenerateRecipes}
        >
          <View style={[
            styles.actionIconContainer,
            { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }
          ]}>
            <UtensilsCrossed size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Recipe Ideas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[cardStyle, styles.actionButton]}
          onPress={() => setAddModalVisible(true)}
        >
          <View style={[
            styles.actionIconContainer,
            { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)' }
          ]}>
            <Plus size={20} color="#22C55E" />
          </View>
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[
        styles.searchBar,
        { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
      ]}>
        <Search size={18} color={isDark ? '#94A3B8' : '#64748B'} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search food items..."
          placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <X size={16} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Food Items List */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Your Food Inventory ({sortedItems.length})
      </Text>
      {sortedItems.length > 0 ? (
        <FlatList
          data={sortedItems}
          renderItem={renderFoodItem}
          keyExtractor={item => item.id}
          style={styles.foodList}
          contentContainerStyle={styles.foodListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <ShoppingCart size={60} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            No food items found
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Add items to track and reduce food waste
          </Text>
        </View>
      )}
      
      {/* Add Item Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[cardStyle, styles.modalContainer]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add New Food Item
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setAddModalVisible(false)}
              >
                <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Form inputs for new item */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Food Name</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F8FAFC',
                      color: colors.text,
                      borderColor: isDark ? '#334155' : '#E2E8F0' 
                    }
                  ]}
                  placeholder="Enter food name"
                  placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({...newItem, name: text})}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Quantity</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F8FAFC',
                      color: colors.text,
                      borderColor: isDark ? '#334155' : '#E2E8F0' 
                    }
                  ]}
                  placeholder="Enter quantity (e.g., 2 lbs, 1 bunch)"
                  placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                />
              </View>
              
              <TouchableOpacity
                style={buttonStyle}
                onPress={handleAddItem}
              >
                <Text style={buttonTextStyle}>Add Food Item</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Recipe Suggestions Modal */}
      <Modal
        visible={recipeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRecipeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[cardStyle, styles.modalContainer]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Recipe Suggestions
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setRecipeModalVisible(false)}
              >
                <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {recipeSuggestions.length > 0 ? (
                recipeSuggestions.map((recipe, index) => (
                  <View 
                    key={index} 
                    style={[
                      cardStyle,
                      { marginBottom: 12 }
                    ]}
                  >
                    <Text style={[styles.recipeTitle, { color: colors.text }]}>
                      {recipe.title}
                    </Text>
                    <Text style={[styles.recipeIngredients, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Ingredients Used: {recipe.ingredientsUsed.join(', ')}
                    </Text>
                    <Text style={[styles.recipeIngredients, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Other Ingredients: {recipe.otherIngredients.join(', ')}
                    </Text>
                    <Text style={[styles.recipeInstructions, { color: colors.text }]}>
                      {recipe.instructions}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Generating recipes based on your expiring items...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {
      elevation: 2,
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 3,
    }),
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {
      elevation: 2,
    }),
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 23,
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    } : {
      elevation: 1,
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  clearSearch: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    paddingBottom: 20,
  },
  foodItemCard: {
    borderRadius: 12,
    marginBottom: 12,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    } : {
      elevation: 2,
    }),
  },
  foodItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIndicator: {
    width: 8,
    height: '60%',
    borderRadius: 4,
    marginRight: 12,
  },
  foodItemDetails: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodItemQuantity: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 6,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 13,
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 4,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeModalButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recipeIngredients: {
    fontSize: 14,
    marginBottom: 12,
  },
  recipeInstructions: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default FoodWasteReducer; 
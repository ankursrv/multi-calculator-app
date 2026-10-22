import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './src/theme/colors';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import KiranaCalculator from './src/screens/KiranaCalculator';
import StandardCalculator from './src/screens/StandardCalculator';
import SmartKhataScreen from './src/screens/SmartKhataScreen';
import DiscountCalculator from './src/screens/DiscountCalculator';
import UnitConverter from './src/screens/UnitConverter';
import EmiCalculator from './src/screens/EmiCalculator';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  
  // Shared Smart Bill / Khata State
  const [billList, setBillList] = useState([
    {
      id: '1',
      name: 'चीनी (Sugar)',
      details: '₹60/kg • ₹10 me (166.67g)',
      result: '₹10.00',
      cost: 10,
    },
    {
      id: '2',
      name: 'सरसों तेल (Mustard Oil)',
      details: '₹140/L • 500ml',
      result: '₹70.00',
      cost: 70,
    },
  ]);

  // Smooth Screen Transition Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const navigateTo = (screenId) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen(screenId);
      if (['home', 'kirana', 'standard', 'bill'].includes(screenId)) {
        setActiveBottomTab(screenId);
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleBottomTabPress = (tabId) => {
    navigateTo(tabId);
  };

  const handleAddItemToBill = (newItem) => {
    setBillList((prev) => [newItem, ...prev]);
  };

  const handleRemoveBillItem = (index) => {
    setBillList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBill = () => {
    setBillList([]);
  };

  const bottomNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      iconActive: 'home',
      type: 'ion',
    },
    {
      id: 'kirana',
      label: 'Kirana Bhav',
      icon: 'scale-bathroom',
      iconActive: 'scale-bathroom',
      type: 'mci',
    },
    {
      id: 'standard',
      label: 'Calculator',
      icon: 'calculator-outline',
      iconActive: 'calculator',
      type: 'ion',
    },
    {
      id: 'bill',
      label: 'Smart Khata',
      icon: 'receipt-outline',
      iconActive: 'receipt',
      type: 'ion',
      badgeCount: billList.length,
    },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={Colors.bgDark} />

        {/* Screen Content with Smooth Animation */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {currentScreen === 'home' && (
            <HomeScreen onSelectScreen={(screenId) => navigateTo(screenId)} />
          )}

          {currentScreen === 'kirana' && (
            <KiranaCalculator
              onBack={() => navigateTo('home')}
              onSaveToBill={(item) => {
                handleAddItemToBill(item);
                navigateTo('bill');
              }}
            />
          )}

          {currentScreen === 'standard' && <StandardCalculator />}

          {currentScreen === 'bill' && (
            <SmartKhataScreen
              billList={billList}
              onAddItem={handleAddItemToBill}
              onRemoveItem={handleRemoveBillItem}
              onClearBill={handleClearBill}
            />
          )}

          {currentScreen === 'discount' && <DiscountCalculator />}
          {currentScreen === 'unit' && <UnitConverter />}
          {currentScreen === 'emi' && <EmiCalculator />}
        </Animated.View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            {bottomNavItems.map((tab) => {
              const isActive = activeBottomTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.navTab}
                  onPress={() => handleBottomTabPress(tab.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    {tab.type === 'ion' ? (
                      <Ionicons
                        name={isActive ? tab.iconActive : tab.icon}
                        size={22}
                        color={isActive ? Colors.amber : Colors.textDim}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={tab.icon}
                        size={22}
                        color={isActive ? Colors.amber : Colors.textDim}
                      />
                    )}

                    {/* Notification Badge if any */}
                    {tab.badgeCount > 0 && (
                      <View style={styles.badgeDot}>
                        <Text style={styles.badgeDotText}>{tab.badgeCount}</Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.navTabLabel,
                      isActive && styles.navTabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>

                  {/* Active Indicator Underline */}
                  {isActive && (
                    <LinearGradient
                      colors={Colors.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activeIndicator}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  contentContainer: {
    flex: 1,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingBottom: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabIconWrap: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.orange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDim,
    marginTop: 3,
  },
  navTabLabelActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});

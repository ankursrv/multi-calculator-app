import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import KharchaTrackerScreen from './src/screens/KharchaTrackerScreen';
import FdCalculator from './src/screens/FdCalculator';

// Global Web Style to remove focus-visible outlines from all input boxes
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'rn-no-focus-outline';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      input, textarea, select, [contenteditable="true"] {
        outline: none !important;
        outline-style: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus,
      input:focus-visible, textarea:focus-visible, select:focus-visible,
      *:focus-visible {
        outline: none !important;
        outline-style: none !important;
        box-shadow: none !important;
      }
      /* Custom sleek scrollbar for web & mobile browsers */
      ::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.4);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(52, 211, 153, 0.45);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(52, 211, 153, 0.8);
      }
    `;
    document.head.appendChild(style);
  }
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  
  // Shared Smart Bill / Khata State — khaali shuru, entries user khud add karega
  const [billList, setBillList] = useState([]);

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
      label: 'Kirana Calc',
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
        {currentScreen === 'kharcha' && (
          <KharchaTrackerScreen onBack={() => navigateTo('home')} />
        )}

        {currentScreen === 'fd' && (
          <FdCalculator onBack={() => navigateTo('home')} />
        )}
      </Animated.View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNavContainer,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 6) },
        ]}
      >
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
                  numberOfLines={1}
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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
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
    backgroundColor: 'rgba(3, 7, 18, 0.98)',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 56,
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
    maxWidth: '92%',
    textAlign: 'center',
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

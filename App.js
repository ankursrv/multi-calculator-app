import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './src/theme/colors';
import { AuthProvider } from './src/context/AuthContext';

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
import GoldRateScreen from './src/screens/GoldRateScreen';
import TyohaarCalendarScreen from './src/screens/TyohaarCalendarScreen';

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

  // Smooth Screen Transition Animation (entrance-only fade + slide)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const transitionRef = useRef(null);
  const currentScreenRef = useRef('home');

  const navigateTo = (screenId) => {
    // Already on this screen - do nothing (prevents jank on re-tapping active tab)
    if (currentScreenRef.current === screenId) return;
    currentScreenRef.current = screenId;

    // Instantly update active tab highlight so the tap feels responsive
    if (['home', 'kharcha', 'standard', 'fd', 'bill'].includes(screenId)) {
      setActiveBottomTab(screenId);
    }

    // Switch content immediately, then animate ONLY the new screen in.
    // No fade-out phase = zero blank/hidden delay and no double-latency feel.
    setCurrentScreen(screenId);

    // Stop any in-flight animation so rapid taps never stack/glitch transitions
    if (transitionRef.current) transitionRef.current.stop();
    fadeAnim.setValue(0);
    slideAnim.setValue(14);

    transitionRef.current = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    transitionRef.current.start();
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

  const { width: screenWidth } = useWindowDimensions();

  const leftNavItems = [
    {
      id: 'kharcha',
      label: 'Daily Expenses',
      icon: 'notebook-outline',
      iconActive: 'notebook',
      type: 'mci',
    },
    {
      id: 'standard',
      label: 'Calculator',
      icon: 'calculator-outline',
      iconActive: 'calculator',
      type: 'ion',
    },
  ];

  const rightNavItems = [
    {
      id: 'fd',
      label: 'FD Calculator',
      icon: 'bank',
      iconActive: 'bank',
      type: 'mci',
    },
    {
      id: 'bill',
      label: 'Smart Khata',
      icon: 'book-open-outline',
      iconActive: 'book-open',
      type: 'mci',
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

        {currentScreen === 'standard' && (
          <StandardCalculator onBack={() => navigateTo('home')} />
        )}

        {currentScreen === 'bill' && (
          <SmartKhataScreen
            billList={billList}
            onAddItem={handleAddItemToBill}
            onRemoveItem={handleRemoveBillItem}
            onClearBill={handleClearBill}
            onBack={() => navigateTo('home')}
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

        {currentScreen === 'gold' && (
          <GoldRateScreen onBack={() => navigateTo('home')} />
        )}

        {currentScreen === 'calendar' && (
          <TyohaarCalendarScreen onBack={() => navigateTo('home')} />
        )}
      </Animated.View>

      {/* Curved Center-Notch Bottom Navigation Bar */}
      {(() => {
        const c = screenWidth / 2;
        const notchWidth = 50;
        const notchDepth = 36;
        const notchPath = `
          M 0 0
          L ${c - notchWidth} 0
          C ${c - 40} 0, ${c - 34} 13, ${c - 30} 20
          C ${c - 26} 27, ${c - 16} ${notchDepth}, ${c} ${notchDepth}
          C ${c + 16} ${notchDepth}, ${c + 26} 27, ${c + 30} 20
          C ${c + 34} 13, ${c + 40} 0, ${c + notchWidth} 0
          L ${screenWidth} 0
          L ${screenWidth} 130
          L 0 130
          Z
        `;
        const notchStroke = `M 0 0 L ${c - notchWidth} 0 C ${c - 40} 0, ${c - 34} 13, ${c - 30} 20 C ${c - 26} 27, ${c - 16} ${notchDepth}, ${c} ${notchDepth} C ${c + 16} ${notchDepth}, ${c + 26} 27, ${c + 30} 20 C ${c + 34} 13, ${c + 40} 0, ${c + notchWidth} 0 L ${screenWidth} 0`;

        const renderTab = (tab) => {
          const isActive = activeBottomTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navTab}
              onPress={() => navigateTo(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                {tab.type === 'ion' ? (
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={21}
                    color={isActive ? Colors.amber : Colors.textDim}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={isActive ? tab.iconActive : tab.icon}
                    size={21}
                    color={isActive ? Colors.amber : Colors.textDim}
                  />
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
        };

        return (
          <View
            style={[
              styles.bottomNavContainer,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 6) },
            ]}
          >
            {/* SVG Curved Notch Background */}
            <Svg width={screenWidth} height={130} style={StyleSheet.absoluteFill}>
              <Path d={notchPath} fill="#030712" />
              <Path
                d={notchStroke}
                stroke="rgba(100, 116, 139, 0.12)"
                strokeWidth={1}
                fill="none"
              />
            </Svg>

            <View style={styles.bottomNavRow}>
              {/* Left 2 Tabs */}
              <View style={styles.navSideGroup}>
                {leftNavItems.map(renderTab)}
              </View>

              {/* Center Notch Spacer */}
              <View style={styles.centerGap} />

              {/* Right 2 Tabs */}
              <View style={styles.navSideGroup}>
                {rightNavItems.map(renderTab)}
              </View>
            </View>

            {/* Elevated Center Floating Home Button */}
            <TouchableOpacity
              style={[styles.centerFabBtn, { left: c - 20 }]}
              onPress={() => navigateTo('home')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={activeBottomTab === 'home' ? Colors.gradientColors : ['#241A12', '#15100B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.centerFabGradient,
                  activeBottomTab === 'home' && styles.centerFabActive,
                ]}
              >
                <Ionicons
                  name={activeBottomTab === 'home' ? 'home' : 'home-outline'}
                  size={17}
                  color={activeBottomTab === 'home' ? '#FFFFFF' : Colors.amber}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      })()}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
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
    backgroundColor: '#030712',
    position: 'relative',
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    paddingHorizontal: 16,
  },
  navSideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  centerGap: {
    width: 80,
    height: '100%',
  },
  centerFabBtn: {
    position: 'absolute',
    top: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 9,
    elevation: 10,
  },
  centerFabGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  centerFabActive: {
    borderColor: '#FEF08A',
    borderWidth: 2.5,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingTop: 6,
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
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.textDim,
    marginTop: 3,
    maxWidth: '96%',
    textAlign: 'center',
  },
  navTabLabelActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});

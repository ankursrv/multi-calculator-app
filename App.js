import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from './src/theme/colors';

import KiranaCalculator from './src/screens/KiranaCalculator';
import StandardCalculator from './src/screens/StandardCalculator';
import DiscountCalculator from './src/screens/DiscountCalculator';
import UnitConverter from './src/screens/UnitConverter';
import EmiCalculator from './src/screens/EmiCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState('kirana');

  const tabs = [
    {
      id: 'kirana',
      label: 'Kirana / Bhav',
      sub: '₹ ↔ Gram',
      icon: 'scale-bathroom',
      iconFamily: 'MaterialCommunityIcons',
      color: Colors.primary,
    },
    {
      id: 'standard',
      label: 'Standard',
      sub: 'Normal Calc',
      icon: 'calculator',
      iconFamily: 'Ionicons',
      color: Colors.accent,
    },
    {
      id: 'discount',
      label: 'Discount & GST',
      sub: '% Bachat',
      icon: 'pricetag',
      iconFamily: 'Ionicons',
      color: Colors.secondary,
    },
    {
      id: 'unit',
      label: 'Unit Convert',
      sub: 'Kg, L, Meter',
      icon: 'swap-horizontal',
      iconFamily: 'Ionicons',
      color: Colors.primaryLight,
    },
    {
      id: 'emi',
      label: 'Loan & EMI',
      sub: 'Byaj Hisaab',
      icon: 'cash',
      iconFamily: 'Ionicons',
      color: Colors.purple,
    },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" backgroundColor={Colors.bg} />

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="calculator-variant" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Multi Calculator</Text>
              <Text style={styles.headerSubtitle}>Kirana • Bhav • Standard • GST • EMI</Text>
            </View>
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Android App</Text>
          </View>
        </View>

        {/* Horizontal Navigation Tabs */}
        <View style={styles.tabBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && {
                      backgroundColor: Colors.cardHighlight,
                      borderColor: tab.color,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  {tab.iconFamily === 'Ionicons' ? (
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={isActive ? tab.color : Colors.textMuted}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={tab.icon}
                      size={18}
                      color={isActive ? tab.color : Colors.textMuted}
                    />
                  )}
                  <View>
                    <Text
                      style={[
                        styles.tabLabel,
                        isActive && { color: Colors.text, fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <Text
                      style={[
                        styles.tabSub,
                        isActive && { color: tab.color },
                      ]}
                    >
                      {tab.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Screen Content */}
        <View style={styles.content}>
          {activeTab === 'kirana' && <KiranaCalculator />}
          {activeTab === 'standard' && <StandardCalculator />}
          {activeTab === 'discount' && <DiscountCalculator />}
          {activeTab === 'unit' && <UnitConverter />}
          {activeTab === 'emi' && <EmiCalculator />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  versionBadge: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  versionText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.bg,
  },
  tabBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabSub: {
    fontSize: 10,
    color: Colors.textDim,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

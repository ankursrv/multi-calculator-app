import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import GradientText from '../components/GradientText';
import SamaaBhavCardGlow from '../components/SamaaBhavCardGlow';
import KharchaCardGlow from '../components/KharchaCardGlow';

export default function HomeScreen({ onSelectScreen }) {
  return (
    <View style={styles.container}>
      {/* Fixed Sticky Header with Gradient, Shadow & Accent Line */}
      <LinearGradient
        colors={['#0B1220', '#151016', '#241307']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.headerWrapper}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={Colors.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <MaterialCommunityIcons name="calculator-variant" size={27} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerOverline}>WELCOME 👋</Text>
            <GradientText
              text="All Calculators"
              style={styles.appTitle}
              colors={['#FBBF24', '#F97316', '#EA580C']}
            />
            <View style={styles.subtitleRow}>
              <Ionicons name="sparkles" size={12} color="#FB923C" style={{ marginRight: 5 }} />
              <Text style={styles.appSubtitle}>Smart Calculators Hub</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Fake drop-shadow fade (real shadows don't render on gradient views in Android) */}
      <LinearGradient
        colors={['rgba(100, 116, 139, 0.28)', 'rgba(100, 116, 139, 0)']}
        style={styles.headerShadowFade}
        pointerEvents="none"
      />

      {/* Scrollable Feature List (Only this scrolls when more items are added) */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Calculator Card: Samaan-Bhav & Kirana */}
        <View style={styles.cardsList}>
          <TouchableOpacity
            style={styles.popularCardWrapper}
            onPress={() => onSelectScreen('kirana')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#211b1b', '#39251d', '#56270f']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.popularCardGradient}
            >
              {/* Exact SVG glow from user's samaa-bhav-card-glow.svg */}
              <SamaaBhavCardGlow />

              {/* Left Calculator Icon */}
              <LinearGradient
                colors={['#FFAA00', '#FF7700', '#F54A00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.2, y: 1 }}
                style={styles.popularIconBox}
              >
                <MaterialCommunityIcons name="calculator-variant" size={30} color="#FFFFFF" />
              </LinearGradient>

              {/* Body */}
              <View style={styles.popularCardBody}>
                <Text style={styles.popularCardTitle}>Samaan-Bhav & Kirana</Text>

                <Text style={styles.popularCardDescHindi}>
                  भाव से बचत या वजन से रुपये की लागत निकालें
                </Text>
                <Text style={styles.popularCardDescEng} numberOfLines={1}>
                  Weight (kg/gm) to Price & Rate Variation Solver
                </Text>
              </View>

              {/* Right Arrow Chevron */}
              <Ionicons
                name="chevron-forward"
                size={26}
                color="#F59E0B"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Kharcha Tracker — Variant B (cool slate + emerald ledger glow) */}
          <TouchableOpacity
            style={styles.trackerCardWrapper}
            onPress={() => onSelectScreen('kharcha')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0B1220', '#12252C', '#0E3A2C']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0.1 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.trackerCardGradient}
            >
              <KharchaCardGlow />

              <LinearGradient
                colors={['#34D399', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.2, y: 1 }}
                style={styles.trackerIconBox}
              >
                <MaterialCommunityIcons name="notebook-outline" size={30} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.trackerCardBody}>
                <Text style={styles.trackerCardTitle}>Kharcha Tracker</Text>
                <Text style={styles.trackerCardDescHindi}>
                  महीने-दर-महीने खर्चा का हिसाब - हर सामान, हर कीमत
                </Text>
                <Text style={styles.trackerCardDescEng} numberOfLines={1}>
                  Monthly & yearly expense register · 100% Offline
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={26}
                color="#34D399"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  headerWrapper: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 20,
  },
  headerShadowFade: {
    height: 18,
    marginTop: -2,
    zIndex: 19,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 2,
  },
  headerOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(248, 250, 252, 0.55)',
    letterSpacing: 1.6,
    marginBottom: 1,
  },
  appTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#FB923C',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  cardsList: {
    gap: 12,
  },
  popularCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  popularCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      backgroundImage:
        'radial-gradient(ellipse at 100% 100%, rgba(255, 112, 0, 0.42) 0%, rgba(143, 55, 9, 0.24) 28%, transparent 55%), linear-gradient(115deg, #211b1b 0%, #39251d 55%, #56270f 100%)',
    }),
  },
  svgWave: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  popularIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  popularCardBody: {
    flex: 1,
  },
  popularCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  popularCardDescHindi: {
    fontSize: 12.5,
    color: '#F8FAFC',
    fontWeight: '600',
    lineHeight: 17,
  },
  popularCardDescEng: {
    fontSize: 11,
    color: '#FB923C',
    fontWeight: '600',
    marginTop: 3,
  },
  trackerCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  trackerCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      backgroundImage:
        'radial-gradient(ellipse at 100% 100%, rgba(52, 211, 153, 0.35) 0%, rgba(16, 185, 129, 0) 55%), linear-gradient(115deg, #0B1220 0%, #12252C 55%, #0E3A2C 100%)',
    }),
  },
  trackerIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  trackerCardBody: {
    flex: 1,
  },
  trackerCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  trackerCardDescHindi: {
    fontSize: 12.5,
    color: '#F8FAFC',
    fontWeight: '600',
    lineHeight: 17,
  },
  trackerCardDescEng: {
    fontSize: 11,
    color: '#6EE7B7',
    fontWeight: '600',
    marginTop: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  featuredCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconBoxRegular: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  cardBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  activeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.amber,
  },
  regularBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  regularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  cardHindiTitle: {
    fontSize: 12,
    color: Colors.amber,
    fontWeight: '600',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.amber,
  },
  infoDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});

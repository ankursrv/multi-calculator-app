import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function HomeScreen({ onSelectScreen }) {
  const [searchQuery, setSearchQuery] = useState('');

  const calculators = [
    {
      id: 'kirana',
      title: 'Samaa-Bhav & Kirana',
      hindiTitle: 'सामान का भाव व वजन',
      desc: 'भाव से वजन या वजन से रुपये की त्वरित गणना',
      icon: 'scale-bathroom',
      iconType: 'mci',
      activeBadge: true,
      featured: true,
    },
    {
      id: 'standard',
      title: 'Standard Calculator',
      hindiTitle: 'साधारण कैलकुलेटर',
      desc: 'दैनिक जोड़, घटाव, गुणा, भाग और प्रतिशत',
      icon: 'calculator',
      iconType: 'ion',
      badge: 'Classic',
    },
    {
      id: 'bill',
      title: 'Kirana Smart Khata / Bill',
      hindiTitle: 'स्मार्ट खरीदारी बिल',
      desc: 'सामान की लिस्ट बनाएं और कुल पर्चा (Total Bill) जोड़ें',
      icon: 'receipt',
      iconType: 'ion',
      badge: 'New Feature',
    },
    {
      id: 'discount',
      title: 'Discount & GST',
      hindiTitle: 'छूट और जीएसटी कैलकुलेटर',
      desc: 'MRP पर बचत, % डिस्काउंट और 5/12/18% GST दर',
      icon: 'pricetag',
      iconType: 'ion',
      badge: 'Shopping',
    },
    {
      id: 'unit',
      title: 'Unit Converter',
      hindiTitle: 'इकाई परिवर्तक',
      desc: 'किलो ↔ ग्राम, लीटर ↔ मिलीलीटर, मीटर ↔ गज/फुट',
      icon: 'swap-horizontal',
      iconType: 'ion',
      badge: 'Utility',
    },
    {
      id: 'emi',
      title: 'Loan & EMI Calculator',
      hindiTitle: 'लोन और ब्याज दर',
      desc: 'मासिक किस्त, मूलधन और कुल ब्याज का सटीक हिसाब',
      icon: 'cash-multiple',
      iconType: 'mci',
      badge: 'Finance',
    },
  ];

  const filteredCalculators = calculators.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hindiTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top App Header Matching User UI */}
      <View style={styles.header}>
        <LinearGradient
          colors={Colors.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoGradient}
        >
          <MaterialCommunityIcons name="calculator-variant" size={26} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.headerTextWrap}>
          <Text style={styles.appTitle}>MultiCalc</Text>
          <Text style={styles.appSubtitle}>सामान का भाव एवं वजन कैलकुलेटर</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.amber} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search calculator..."
          placeholderTextColor={Colors.textDim}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {/* Calculator Cards List */}
      <View style={styles.cardsList}>
        {filteredCalculators.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.featured && styles.featuredCard]}
            onPress={() => onSelectScreen(item.id)}
            activeOpacity={0.8}
          >
            {/* Card Left Icon */}
            {item.featured ? (
              <LinearGradient
                colors={Colors.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <MaterialCommunityIcons name={item.icon} size={26} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.cardIconBoxRegular}>
                {item.iconType === 'mci' ? (
                  <MaterialCommunityIcons name={item.icon} size={24} color={Colors.amber} />
                ) : (
                  <Ionicons name={item.icon} size={24} color={Colors.amber} />
                )}
              </View>
            )}

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.activeBadge && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
                {item.badge && !item.activeBadge && (
                  <View style={styles.regularBadge}>
                    <Text style={styles.regularBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardHindiTitle}>{item.hindiTitle}</Text>
              <Text style={styles.cardDesc} numberOfLines={1}>
                {item.desc}
              </Text>
            </View>

            {/* Right Arrow Chevron */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={item.featured ? Colors.amber : Colors.textDim}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Summary / Kirana Tip Card */}
      <View style={styles.infoBox}>
        <View style={styles.infoTitleRow}>
          <Ionicons name="bulb-outline" size={18} color={Colors.amber} />
          <Text style={styles.infoTitle}>Kirana Quick Tip</Text>
        </View>
        <Text style={styles.infoDesc}>
          अगर चीनी का भाव ₹60/kg है और आपको ₹10 की चाहिए, तो "Samaa-Bhav & Kirana" पर टैप करें। यह तुरंत 166.67 ग्राम की सटीक मात्रा निकाल देगा!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
    gap: 12,
  },
  logoGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTextWrap: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
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

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import {
  formatTimeAgo,
  openInGoogleMaps,
  openDirections,
  shareLocationLink,
} from '../hooks/useLocationShare';
import { useLocationShareContext } from '../context/LocationShareContext';

export default function LocationShareScreen({ onBack }) {
  const {
    isCloudEnabled,
    deviceName,
    setDeviceName,
    familyCode,
    setFamilyCode,
    existingKharchaCode,
    generateNewCode,
    permissionStatus,
    requestForegroundPermission,
    requestBackgroundPermission,
    isSharing,
    myLocation,
    partnerLocations,
    isRefreshing,
    error,
    setError,
    startSharing,
    stopSharing,
    refreshPartners,
  } = useLocationShareContext();

  const [isStarting, setIsStarting] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Pulse animation for live sharing badge initialized via state to satisfy React 19 rules
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isSharing) {
      const animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
      return () => animLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSharing, pulseAnim]);

  // Initial pull of partners if familyCode exists
  useEffect(() => {
    if (familyCode && familyCode.length >= 8) {
      refreshPartners();
    }
  }, [familyCode, refreshPartners]);

  const handleStartSharing = async () => {
    const trimmedCode = (familyCode || '').trim().toUpperCase();
    const trimmedName = (deviceName || '').trim();

    if (!trimmedName) {
      setError('Kripya apna naam ya phone name darj karein.');
      return;
    }

    if (!trimmedCode || trimmedCode.length < 8) {
      setError('Kripya kam se kam 8-akshar ka family code darj karein.');
      return;
    }

    setIsStarting(true);
    const success = await startSharing(trimmedCode);
    setIsStarting(false);

    if (success) {
      setError(null);
    }
  };

  const handleGenerateCode = async () => {
    await generateNewCode();
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleUseKharchaCode = async () => {
    if (existingKharchaCode) {
      await setFamilyCode(existingKharchaCode);
    }
  };

  const handleShareCodeOnly = async () => {
    const code = (familyCode || '').trim().toUpperCase();
    if (!code) {
      Alert.alert('Code Chahiye', 'Pehle family code banayein ya type karein.');
      return;
    }
    await shareLocationLink({
      familyCode: code,
      deviceName: deviceName || 'Partner',
    });
  };

  const handleQuickEmergencyShare = async () => {
    if (!myLocation) {
      Alert.alert(
        'Location Uplabdh Nahi',
        'Emergency location bhejne se pehle GPS chalu karein ya sharing shuru karein.'
      );
      return;
    }
    await shareLocationLink({
      familyCode: isSharing ? familyCode : undefined,
      deviceName: deviceName || 'Emergency',
      latitude: myLocation.latitude,
      longitude: myLocation.longitude,
    });
  };

  const formatCoord = (val) => {
    if (val == null) return '--';
    const num = Number(val);
    return isNaN(num) ? '--' : num.toFixed(5);
  };

  const isGpsGranted = permissionStatus.foregroundGranted;
  const isBgGranted = permissionStatus.backgroundGranted;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Live Location Share"
        subtitle="Partner ke sath private & safe location sharing"
        icon="map"
        onBack={onBack}
        theme="emerald"
      />

      {/* Cloud Status Warning if Supabase is offline */}
      {!isCloudEnabled && (
        <View style={styles.cloudNotice}>
          <Ionicons name="information-circle-outline" size={18} color="#FBBF24" />
          <Text style={styles.cloudNoticeText}>
            Cloud sync band hai — Live sync ke liye Supabase credentials zaroori hain.
          </Text>
        </View>
      )}

      {/* Permission Status Bar */}
      <View style={styles.permRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            { borderColor: isGpsGranted ? Colors.success : Colors.danger },
            !isGpsGranted && styles.chipAlert,
          ]}
          onPress={requestForegroundPermission}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isGpsGranted ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={isGpsGranted ? Colors.success : Colors.danger}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.chipText,
              { color: isGpsGranted ? Colors.success : Colors.danger },
            ]}
          >
            GPS: {isGpsGranted ? 'Granted' : 'Allow Karein'}
          </Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: isBgGranted ? Colors.success : Colors.cardBorder },
            ]}
            onPress={isGpsGranted ? requestBackgroundPermission : requestForegroundPermission}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBgGranted ? 'shield-checkmark' : 'shield-outline'}
              size={14}
              color={isBgGranted ? Colors.success : Colors.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.chipText,
                { color: isBgGranted ? Colors.success : Colors.textMuted },
              ]}
            >
              Background: {isBgGranted ? 'Active' : 'Optional'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* GPS Warning Banner if Foreground is Denied */}
      {!isGpsGranted && permissionStatus.checked && (
        <View style={styles.permBanner}>
          <View style={styles.permBannerIcon}>
            <Ionicons name="navigate-circle" size={28} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permBannerTitle}>GPS Permission Chahiye</Text>
            <Text style={styles.permBannerText}>
              Aapki live location partner ko bhejne ke liye device GPS permission zaroori hai.
            </Text>
            <TouchableOpacity
              style={styles.permBannerBtn}
              onPress={requestForegroundPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permBannerBtnText}>GPS Allow Karein</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Main Sharing Card */}
      {isSharing ? (
        /* ACTIVE SHARING VIEW */
        <View style={styles.activeCard}>
          <LinearGradient
            colors={['#062A26', '#083B37', '#0A4A45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeCardGradient}
          >
            {/* Top row: Live badge & Code */}
            <View style={styles.activeTopRow}>
              <View style={styles.liveBadgeRow}>
                <Animated.View
                  style={[
                    styles.pulsingDot,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={styles.liveBadgeText}>LIVE SHARING ON</Text>
              </View>

              <View style={styles.familyCodeTag}>
                <Text style={styles.codeTagLabel}>Code:</Text>
                <Text style={styles.codeTagVal}>{familyCode}</Text>
              </View>
            </View>

            {/* My Location details */}
            <View style={styles.locationDetails}>
              <Text style={styles.activeDevName}>
                📱 {deviceName || 'Aapka Device'}
              </Text>

              {myLocation?.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location-sharp" size={16} color="#34D399" />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {myLocation.address}
                  </Text>
                </View>
              )}

              {myLocation ? (
                <View style={styles.coordGrid}>
                  <View style={styles.coordCol}>
                    <Text style={styles.coordLabel}>Latitude</Text>
                    <Text style={styles.coordVal}>{formatCoord(myLocation.latitude)}</Text>
                  </View>
                  <View style={styles.coordCol}>
                    <Text style={styles.coordLabel}>Longitude</Text>
                    <Text style={styles.coordVal}>{formatCoord(myLocation.longitude)}</Text>
                  </View>
                  <View style={styles.coordCol}>
                    <Text style={styles.coordLabel}>Accuracy</Text>
                    <Text style={styles.coordVal}>
                      {myLocation.accuracy ? `±${myLocation.accuracy}m` : '--'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.locatingRow}>
                  <ActivityIndicator size="small" color="#34D399" />
                  <Text style={styles.locatingText}>GPS Location fetch ho rahi hai...</Text>
                </View>
              )}

              <Text style={styles.lastUpdateText}>
                Antim Update: {formatTimeAgo(myLocation?.updated_at)}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.activeActionsRow}>
              {myLocation && (
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() =>
                    openInGoogleMaps(
                      myLocation.latitude,
                      myLocation.longitude,
                      deviceName || 'Meri Location'
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color="#34D399" />
                  <Text style={styles.actionBtnOutlineText}>Google Maps</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={handleShareCodeOnly}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={16} color="#34D399" />
                <Text style={styles.actionBtnOutlineText}>Code Bhejein</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stopBtn}
                onPress={stopSharing}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={16} color="#FFFFFF" />
                <Text style={styles.stopBtnText}>Band Karein</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      ) : (
        /* SETUP / START SHARING CARD */
        <View style={styles.setupCard}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.headerIconCircle}
            >
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.setupTitle}>Partner Ke Sath Share Karein</Text>
              <Text style={styles.setupSub}>
                Dono devices par same family code enter karein
              </Text>
            </View>
          </View>

          {/* Device Name input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aapka Naam / Phone Name</Text>
            <TextInput
              style={styles.input}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="Jaise: Papa, Mummy, Rohan, Phone 1"
              placeholderTextColor={Colors.textDim}
              maxLength={24}
            />
          </View>

          {/* Family Code input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelWithAction}>
              <Text style={styles.inputLabel}>Family Code (8 Akshar)</Text>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerateCode}
                activeOpacity={0.7}
              >
                <Ionicons name="sparkles" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.generateBtnText}>Naya Code</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.codeInput]}
              value={familyCode}
              onChangeText={setFamilyCode}
              placeholder="Jaise: ABCD1234"
              placeholderTextColor={Colors.textDim}
              maxLength={16}
              autoCapitalize="characters"
            />
          </View>

          {copiedNotice && (
            <View style={styles.toastNotice}>
              <Ionicons name="checkmark-circle" size={14} color="#34D399" />
              <Text style={styles.toastText}>Naya Code ban gaya hai aur set ho gaya hai!</Text>
            </View>
          )}

          {/* Optional Kharcha Tracker family code button */}
          {existingKharchaCode && existingKharchaCode !== familyCode && (
            <TouchableOpacity
              style={styles.kharchaCodeChip}
              onPress={handleUseKharchaCode}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={15} color="#34D399" />
              <Text style={styles.kharchaCodeText}>
                Kharcha Tracker Code Use Karein: <Text style={styles.kharchaBold}>{existingKharchaCode}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Row */}
          <View style={styles.setupActionsRow}>
            <TouchableOpacity
              style={styles.shareCodeOnlyBtn}
              onPress={handleShareCodeOnly}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={18} color="#34D399" />
              <Text style={styles.shareCodeOnlyText}>Code Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startBtn,
                (!familyCode || familyCode.trim().length < 8 || !(deviceName || '').trim()) &&
                  styles.startBtnDisabled,
              ]}
              onPress={handleStartSharing}
              disabled={
                isStarting ||
                !familyCode ||
                familyCode.trim().length < 8 ||
                !(deviceName || '').trim()
              }
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="radio" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.startBtnText}>Sharing Shuru Karein</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Partner Locations Section */}
      <View style={styles.partnersSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people" size={18} color="#34D399" />
            <Text style={styles.sectionTitle}>
              Partner Ki Location ({partnerLocations.length})
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refreshPartners}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#34D399" />
            ) : (
              <View style={styles.refreshInner}>
                <Ionicons name="sync" size={15} color="#34D399" />
                <Text style={styles.refreshText}>Refresh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {partnerLocations.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={32} color={Colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>Abhi koi partner live nahi hai</Text>
            <Text style={styles.emptySub}>
              Partner ko bhi apna Family Code{' '}
              <Text style={styles.emptyHighlight}>
                {familyCode || 'dono phones me same'}
              </Text>{' '}
              enter karke &quot;Sharing Shuru Karein&quot; par tap karne ko bolein.
            </Text>

            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={handleShareCodeOnly}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#34D399" style={{ marginRight: 6 }} />
              <Text style={styles.inviteBtnText}>Partner Ko Code Bhejein</Text>
            </TouchableOpacity>
          </View>
        ) : (
          partnerLocations.map((p) => (
            <View key={p.id} style={styles.partnerCard}>
              <View style={styles.partnerTop}>
                <View style={styles.partnerNameRow}>
                  <View style={styles.partnerAvatar}>
                    <Text style={styles.partnerAvatarText}>
                      {(p.device_name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.partnerName}>{p.device_name || 'Partner'}</Text>
                    <Text style={styles.partnerTime}>
                      {formatTimeAgo(p.updated_at)}
                    </Text>
                  </View>
                </View>

                {/* Distance Badge */}
                {p.formattedDistance ? (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="car-outline" size={13} color="#34D399" />
                    <Text style={styles.distanceText}>{p.formattedDistance} door</Text>
                  </View>
                ) : (
                  <View style={styles.liveBadgeSmall}>
                    <View style={styles.smallLiveDot} />
                    <Text style={styles.smallLiveText}>Live</Text>
                  </View>
                )}
              </View>

              {/* Coordinates & Accuracy */}
              <View style={styles.partnerCoordRow}>
                <Text style={styles.partnerCoordText}>
                  📍 {formatCoord(p.latitude)}, {formatCoord(p.longitude)}
                </Text>
                {p.accuracy != null && (
                  <Text style={styles.partnerAccuracyText}>
                    (±{Math.round(p.accuracy)}m)
                  </Text>
                )}
              </View>

              {/* Quick Actions for Partner */}
              <View style={styles.partnerActionsRow}>
                <TouchableOpacity
                  style={styles.partnerActionBtn}
                  onPress={() =>
                    openInGoogleMaps(
                      p.latitude,
                      p.longitude,
                      p.device_name || 'Partner Location'
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="map" size={14} color="#34D399" style={{ marginRight: 6 }} />
                  <Text style={styles.partnerActionText}>Maps me Dekhein</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.partnerActionBtn, styles.partnerActionBtnPrimary]}
                  onPress={() =>
                    openDirections(
                      p.latitude,
                      p.longitude,
                      myLocation?.latitude,
                      myLocation?.longitude
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.partnerActionText, { color: '#FFFFFF' }]}>
                    Rasta (Direction)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Emergency Quick Location Sharing Banner */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyIconBox}>
          <MaterialCommunityIcons name="alert-decagram" size={24} color="#EF4444" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.emergencyTitle}>Emergency Location Share</Text>
          <Text style={styles.emergencyDesc}>
            Zaroorat padne par turant apni current GPS location WhatsApp/SMS par bhejein.
          </Text>
          <TouchableOpacity
            style={styles.emergencyBtn}
            onPress={handleQuickEmergencyShare}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emergencyBtnText}>Turant Location Bhejein</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy & Mutual Consent Notice */}
      <View style={styles.consentCard}>
        <Ionicons name="shield-checkmark" size={20} color="#34D399" />
        <Text style={styles.consentText}>
          <Text style={styles.consentBold}>100% Private & Consent-Based: </Text>
          Location sirf wahi dekh sakta hai jiske paas aapka Family Code hai. Sharing 1
          ghante baad automatically expire ho jaati hai, aur aap kisi bhi waqt &quot;Band
          Karein&quot; daba sakte hain.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  cloudNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  cloudNoticeText: {
    fontSize: 12,
    color: '#FBBF24',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  permRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  chipAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  permBannerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  permBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  permBannerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  permBannerBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permBannerBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  // Active Card Styles
  activeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginBottom: 20,
  },
  activeCardGradient: {
    padding: 16,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  familyCodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  codeTagLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginRight: 4,
  },
  codeTagVal: {
    color: '#34D399',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  locationDetails: {
    backgroundColor: 'rgba(11, 15, 25, 0.55)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.15)',
    marginBottom: 14,
  },
  activeDevName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  coordGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  coordCol: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  coordVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  locatingText: {
    fontSize: 12,
    color: '#34D399',
    marginLeft: 8,
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 4,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
  },
  actionBtnOutlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34D399',
    marginLeft: 5,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  stopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  // Setup Card Styles
  setupCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  setupSub: {
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  labelWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  generateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  codeInput: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toastNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  toastText: {
    fontSize: 11.5,
    color: '#34D399',
    fontWeight: '600',
    marginLeft: 6,
  },
  kharchaCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 10,
    padding: 9,
    marginBottom: 14,
  },
  kharchaCodeText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  kharchaBold: {
    color: '#34D399',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  setupActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  shareCodeOnlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  shareCodeOnlyText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#34D399',
    marginLeft: 6,
  },
  startBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Partners Section
  partnersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: 8,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  refreshInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 11.5,
    color: '#34D399',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyHighlight: {
    color: '#34D399',
    fontWeight: '700',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  inviteBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#34D399',
  },
  partnerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginBottom: 10,
  },
  partnerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  partnerTime: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  distanceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34D399',
    marginLeft: 4,
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  smallLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 4,
  },
  smallLiveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34D399',
  },
  partnerCoordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.5)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  partnerCoordText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  partnerAccuracyText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  partnerActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  partnerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  partnerActionBtnPrimary: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  partnerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  // Emergency Card
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 16,
    alignItems: 'center',
  },
  emergencyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
  emergencyDesc: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  // Consent Card
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  consentText: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    marginLeft: 8,
    flex: 1,
  },
  consentBold: {
    color: '#34D399',
    fontWeight: '700',
  },
});

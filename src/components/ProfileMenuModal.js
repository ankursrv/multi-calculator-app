import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth, getUserBadgeInitials } from '../context/AuthContext';

export default function ProfileMenuModal({
  visible,
  onClose,
  onOpenEditProfile,
}) {
  const { currentUser, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
        onClose();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout from this device?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              logout();
              onClose();
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  if (!visible || !isLoggedIn || !currentUser) return null;

  const initials = getUserBadgeInitials(currentUser.name || 'User');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Ionicons name="person-circle" size={20} color="#34D399" />
                  <Text style={styles.headerTitle}>Account</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* User Information Card */}
              <View style={styles.userCard}>
                <LinearGradient
                  colors={['#FBBF24', '#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View style={styles.avatarInnerContainer}>
                    {currentUser.avatarImage ? (
                      <Image source={{ uri: currentUser.avatarImage }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.initialsBox}>
                        <Text style={styles.initialsText}>{initials}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {currentUser.name || 'User'}
                    </Text>
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark-circle" size={11} color="#34D399" />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.userPhone}>
                    +91 {currentUser.phone ? currentUser.phone.replace(/(\d{5})(\d{5})/, '$1 $2') : '---'}
                  </Text>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                {/* 1. Edit Profile */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onOpenEditProfile();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Ionicons name="create-outline" size={20} color="#38BDF8" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Edit Profile</Text>
                    <Text style={styles.menuDesc}>Change photo, name and mobile number</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                </TouchableOpacity>

                {/* 2. Logout */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.75}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Ionicons name="log-out-outline" size={20} color="#F87171" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: '#F87171' }]}>Logout</Text>
                    <Text style={styles.menuDesc}>Sign out from this device</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#F87171" />
                </TouchableOpacity>
              </View>

              {/* Secure note */}
              <View style={styles.bottomNote}>
                <Ionicons name="shield-checkmark" size={13} color="#34D399" />
                <Text style={styles.bottomNoteText}>Your expense records are securely saved.</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  avatarGradientRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    maxWidth: 160,
  },
  userPhone: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  menuContainer: {
    gap: 10,
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bottomNoteText: {
    fontSize: 11,
    color: '#6EE7B7',
    fontWeight: '500',
    flex: 1,
  },
});

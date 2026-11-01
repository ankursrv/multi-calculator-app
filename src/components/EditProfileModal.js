import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { useAuth, getUserBadgeInitials } from '../context/AuthContext';

function EditProfileContent({ currentUser, updateProfile, onClose }) {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarImage, setAvatarImage] = useState(currentUser.avatarImage || null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Pick image from phone gallery
  const handlePickImage = async () => {
    try {
      // Request permission on mobile
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera roll permission is required to select photos.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarImage(result.assets[0].uri);
        setError('');
      }
    } catch (_err) {
      setError('Could not access gallery. Please try again.');
    }
  };

  const handleSave = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Name cannot be empty.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateProfile({
        name: cleanName,
        phone: cleanPhone,
        avatarImage,
      });
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    } catch (_e) {
      setSaving(false);
      setError('Failed to update profile.');
    }
  };

  const initials = getUserBadgeInitials(name || currentUser.name || 'User');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Avatar Preview with overlapping Pencil Icon button */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarTouchTarget}
                  onPress={handlePickImage}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FBBF24', '#F97316', '#EA580C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradientRing}
                  >
                    <View style={styles.avatarInnerContainer}>
                      {avatarImage ? (
                        <Image source={{ uri: avatarImage }} style={styles.avatarImg} />
                      ) : (
                        <View style={styles.initialsBox}>
                          <Text style={styles.initialsText}>{initials}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>

                  {/* Pencil Icon centered at the bottom of circle */}
                  <View style={styles.pencilCircleBadge}>
                    <Image
                      source={require('../../assets/pencil.png')}
                      style={styles.pencilImg}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
                  <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={14} color="#F87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Full Name Field with Pencil icon */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={(t) => {
                      setError('');
                      setName(t);
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textDim}
                  />
                  <Image source={require('../../assets/pencil.png')} style={styles.fieldPencilImg} resizeMode="contain" />
                </View>
              </View>

              {/* Mobile Number Field with Pencil icon */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.countryCodeFixed}>+91</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={(t) => {
                      setError('');
                      setPhone(t.replace(/\D/g, '').slice(0, 10));
                    }}
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.textDim}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  <Image source={require('../../assets/pencil.png')} style={styles.fieldPencilImg} resizeMode="contain" />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, savedSuccess && styles.saveBtnSuccess]}
                onPress={handleSave}
                disabled={saving || savedSuccess}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#022C22" />
                ) : savedSuccess ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#022C22" />
                    <Text style={styles.saveBtnText}>Changes Saved!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#022C22" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function EditProfileModal({ visible, onClose }) {
  const { currentUser, updateProfile } = useAuth();

  if (!visible || !currentUser) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <EditProfileContent
        currentUser={currentUser}
        updateProfile={updateProfile}
        onClose={onClose}
      />
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
    maxWidth: 390,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
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
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarTouchTarget: {
    position: 'relative',
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarGradientRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  initialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pencilCircleBadge: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 6,
    zIndex: 10,
  },
  pencilImg: {
    width: 17,
    height: 17,
  },
  changePhotoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#34D399',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    paddingHorizontal: 12,
    height: 48,
  },
  countryCodeFixed: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  fieldPencilImg: {
    width: 16,
    height: 16,
    marginLeft: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34D399',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  saveBtnSuccess: {
    backgroundColor: '#10B981',
  },
  saveBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#022C22',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

function LoginForm({ onClose, onSuccess }) {
  const { loginWithPhone } = useAuth();

  const [step, setStep] = useState(1); // 1 = Name + Phone input, 2 = 6-box OTP
  const countryCode = '+91';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const otpInputsRef = useRef([]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Send OTP handler with mandatory Name validation
  const handleSendOtp = () => {
    setError('');
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter your full name (Mandatory).');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Generate a realistic 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setStep(2);
      setCountdown(30);
      setLoading(false);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
    }, 500);
  };

  // OTP Box Change handler with auto-advance and backspace handling
  const handleOtpChange = (text, index) => {
    setError('');
    const digit = text.slice(-1).replace(/\D/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const nextOtp = [...otp];
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Quick auto-fill for testing/demo
  const handleAutoFill = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split('');
    setOtp(digits);
    setError('');
  };

  // Verify OTP & Login
  const handleVerify = async () => {
    setError('');
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (fullCode !== generatedOtp) {
      setError('Invalid OTP code. Please enter the correct code.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhone({
        name: name.trim(),
        phone,
        countryCode,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (_err) {
      setLoading(false);
      setError('Failed to login. Please try again.');
    }
  };

  const isFormValid = name.trim().length > 0 && phone.replace(/\D/g, '').length === 10;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback>
          <View style={styles.card}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Icon & Title */}
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait" size={26} color="#34D399" />
            </View>

            <Text style={styles.title}>
              {step === 1 ? 'Login with Mobile' : 'Verify OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Enter your name and mobile number to keep your expenses secure'
                : `Enter the 6-digit code sent to ${countryCode} ${phone}`}
            </Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={14} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* STEP 1: Name + Phone Input */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                {/* Mandatory Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>
                    Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="person-outline" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={(t) => {
                        setError('');
                        setName(t);
                      }}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor={Colors.textDim}
                      autoFocus={true}
                    />
                  </View>
                </View>

                {/* Mobile Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>
                    Mobile Number <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
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
                    {phone.length > 0 && (
                      <TouchableOpacity onPress={() => setPhone('')} style={styles.clearPhoneBtn}>
                        <Ionicons name="close-circle" size={16} color={Colors.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>



                <TouchableOpacity
                  style={[styles.primaryBtn, (!isFormValid || loading) && styles.primaryBtnDisabled]}
                  onPress={handleSendOtp}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#022C22" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send OTP Code</Text>
                      <Ionicons name="arrow-forward" size={16} color="#022C22" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: 6-Box OTP Input */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                {/* Demo OTP Banner for Instant Testing */}
                {generatedOtp ? (
                  <TouchableOpacity
                    style={styles.demoOtpToast}
                    onPress={handleAutoFill}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="notifications" size={14} color="#FBBF24" />
                    <Text style={styles.demoOtpText}>
                      Demo OTP: <Text style={styles.demoOtpCode}>{generatedOtp}</Text>
                    </Text>
                    <View style={styles.autoFillPill}>
                      <Text style={styles.autoFillPillText}>Auto-Fill ⚡</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* 6 OTP Boxes with perfectly centered digits */}
                <View style={styles.otpBoxesRow}>
                  {otp.map((digit, idx) => (
                    <View
                      key={`otp-${idx}`}
                      style={[
                        styles.otpBoxWrapper,
                        digit ? styles.otpBoxFilled : null,
                        otp.join('').length === idx ? styles.otpBoxActive : null,
                      ]}
                    >
                      <TextInput
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(t) => handleOtpChange(t, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus={true}
                        textAlign="center"
                      />
                    </View>
                  ))}
                </View>

                {/* Resend Timer only (Change Number removed as requested) */}
                <View style={styles.resendCenterRow}>
                  {countdown > 0 ? (
                    <View style={styles.timerBadge}>
                      <Ionicons name="time-outline" size={13} color="#94A3B8" />
                      <Text style={styles.countdownText}>Resend code in {countdown}s</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      style={styles.resendActiveBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="refresh" size={14} color="#34D399" />
                      <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (otp.join('').length !== 6 || loading) && styles.primaryBtnDisabled]}
                  onPress={handleVerify}
                  disabled={otp.join('').length !== 6 || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#022C22" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={16} color="#022C22" />
                      <Text style={styles.primaryBtnText}>Verify & Login</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function LoginModal({ visible, onClose, onSuccess }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <LoginForm onClose={onClose} onSuccess={onSuccess} />
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
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 10,
    marginBottom: 16,
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
    width: '100%',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 11.5,
    color: '#FCA5A5',
    fontWeight: '600',
    flex: 1,
  },
  stepContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#F87171',
    fontWeight: '900',
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
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    overflow: 'hidden',
    height: 48,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(100, 116, 139, 0.35)',
    height: '100%',
  },
  flagEmoji: {
    fontSize: 15,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 1.5,
  },
  clearPhoneBtn: {
    paddingHorizontal: 10,
  },
  mergeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
    marginBottom: 14,
  },
  mergeHintText: {
    fontSize: 11,
    color: '#6EE7B7',
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34D399',
    borderRadius: 12,
    height: 46,
    marginTop: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#022C22',
  },
  demoOtpToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 16,
  },
  demoOtpText: {
    fontSize: 12,
    color: '#FDE68A',
    fontWeight: '600',
  },
  demoOtpCode: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FBBF24',
  },
  autoFillPill: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoFillPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#451A03',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  otpBoxWrapper: {
    width: 44,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#0B0F19',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: 'rgba(52, 211, 153, 0.6)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  otpBoxActive: {
    borderColor: '#34D399',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#34D399',
    padding: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  resendCenterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countdownText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  resendActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
  },
});

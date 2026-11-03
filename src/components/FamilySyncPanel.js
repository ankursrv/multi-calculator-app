// Family sync card for the Kharcha Tracker: create or join a family, see the
// shared members, and check the sync status.
//
// The card renders nothing at all until the Supabase env vars are present, so
// a build without cloud config is byte-for-byte the old offline app.
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { CLOUD_ENABLED, FAMILY_CODE_LENGTH, makeFamilyCode, normalizeFamilyCode } from '../lib/supabaseConfig';
import { cloud } from '../lib/cloudApi';
import { clearMeta, setMeta } from '../lib/kharchaSync';

const EMERALD = '#34D399';
const EMERALD_SOFT = 'rgba(52, 211, 153, 0.14)';
const AMBER = '#FBBF24';

export default function FamilySyncPanel({ meta, statusText, syncing, onMetaChange, onSyncNow, userScope }) {
  const [mode, setMode] = useState(null); // 'create' | 'join' | null
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [members, setMembers] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [codeVisible, setCodeVisible] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);

  const linked = !!(meta && meta.familyCode);
  const trimmedName = name.trim();

  // ── Accordion: one Animated.Value drives the height, the fade and the chevron ──
  const [open, setOpen] = useState(false);
  const [bodyH, setBodyH] = useState(0); // measured height that the animation grows to
  const [anim] = useState(() => new Animated.Value(0));
  const bodyHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, bodyH] });
  const bodyFade = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });
  const chevronRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toggleOpen = useCallback(() => {
    const next = !open;
    setOpen(next);
    Animated.timing(anim, {
      toValue: next ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false, // height can't be animated on the native driver
    }).start();
  }, [anim, open]);

  // The body keeps changing size (form opens, members load, errors appear), so
  // re-measure on every layout and stay pinned open while the card is open.
  const handleBodyLayout = useCallback(
    (e) => {
      setBodyH(e.nativeEvent.layout.height);
      if (open) anim.setValue(1);
    },
    [anim, open],
  );

  // Members list is refreshed automatically while linked
  useEffect(() => {
    if (!linked || !meta?.familyCode) return undefined;
    let alive = true;
    const fetchMembers = () => {
      cloud.listMembers(meta.familyCode).then((rows) => {
        if (alive && rows) setMembers(rows);
      });
    };
    fetchMembers();
    const interval = setInterval(fetchMembers, 10000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [linked, meta]);

  const resetForm = () => {
    setMode(null);
    setName('');
    setJoinCode('');
    setDraftCode('');
    setError('');
    setCodeVisible(false);
  };

  // ── Create: this phone starts a new family ──────────────────────────────
  const handleCreate = async () => {
    if (!trimmedName) {
      setError('Please Enter Name');
      return;
    }
    setBusy(true);
    setError('');
    const code = draftCode || makeFamilyCode();
    const made = await cloud.createFamily(code);
    if (!made) {
      setBusy(false);
      setError('इंटरनेट से कनेक्ट नहीं हो रहा। दोबारा कोशिश करें।');
      return;
    }
    await cloud.addMember(code, trimmedName);
    await clearMeta(userScope); // drop any old family's sync bookkeeping
    const next = await setMeta({
      familyCode: code,
      deviceName: trimmedName,
      role: 'owner',
      lastPulledAt: 0,
    }, userScope);
    setBusy(false);
    onMetaChange(next, true);
  };

  // ── Join: this phone enters an existing family code ─────────────────────
  const handleJoin = async () => {
    const code = normalizeFamilyCode(joinCode);
    if (!code) {
      setError(`${FAMILY_CODE_LENGTH} अक्षर का कोड डालें (जैसे ABCD2EFG)।`);
      return;
    }
    if (!trimmedName) {
      setError('Please Enter Name');
      return;
    }
    setBusy(true);
    setError('');
    const exists = await cloud.checkFamily(code);
    if (exists === null) {
      setBusy(false);
      setError('इंटरनेट नहीं है। कनेक्शन के बाद दोबारा कोशिश करें।');
      return;
    }
    if (!exists) {
      setBusy(false);
      setError('यह कोड किसी Family का नहीं है। कोड ध्यान से देखकर डालें।');
      return;
    }
    await cloud.addMember(code, trimmedName);
    await clearMeta(userScope);
    const next = await setMeta({
      familyCode: code,
      deviceName: trimmedName,
      role: 'member',
      lastPulledAt: 0,
    }, userScope);
    setBusy(false);
    onMetaChange(next);
  };

  const handleLeave = async () => {
    if (meta?.familyCode && meta?.deviceName) {
      await cloud.removeMember(meta.familyCode, meta.deviceName).catch(() => { });
    }
    await clearMeta(userScope);
    setMembers(null);
    setName(''); // Family से हटते ही सिर्फ नाम की field reset हो, बाकी सब वैसा ही रहेगा
    setShowMembersModal(false);
    setMemberToDelete(null);
    onMetaChange(null);
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete || !meta?.familyCode) return;
    setDeletingMember(true);
    try {
      if (memberToDelete === meta?.deviceName) {
        await handleLeave();
        return;
      }
      await cloud.removeMember(meta.familyCode, memberToDelete);
      setMembers((prev) => (prev ? prev.filter((m) => m.device_name !== memberToDelete) : []));
      setMemberToDelete(null);
    } catch (_e) {
      // ignore
    } finally {
      setDeletingMember(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!CLOUD_ENABLED) return null;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.head}
        onPress={toggleOpen}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Ionicons name="people-outline" size={18} color={EMERALD} />
        <Text style={styles.title}>Family के साथ शेयर करें</Text>
        <Animated.View style={[styles.chevronBox, { transform: [{ rotate: chevronRotate }] }]}>
          <Ionicons name="chevron-down" size={16} color={EMERALD} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.body, { height: bodyHeight, opacity: bodyFade }]}
      >
        <View style={styles.bodyInner} onLayout={handleBodyLayout}>
          {!linked ? (
            <>
              {mode === null ? (
                <View style={styles.btnRow}>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => {
                      setDraftCode(makeFamilyCode());
                      setMode('create');
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryBtnText}>नई Family बनाएं</Text>
                  </Pressable>
                  <Pressable style={styles.ghostBtn} onPress={() => setMode('join')} accessibilityRole="button">
                    <Text style={styles.ghostBtnText}>कोड से जुड़ें</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.label}>आपका नाम (खर्चा के साथ दिखेगा)</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="E.g. John"
                    placeholderTextColor={Colors.placeholderHint}
                    maxLength={24}
                  />
                  {!!error && <Text style={styles.error}>{error}</Text>}

                  {mode === 'create' ? (
                    <>
                      <Text style={styles.label}>Family कोड</Text>
                      <View style={styles.codeWrap}>
                        <TextInput
                          style={[styles.input, styles.codeInput, styles.codeInputWithIcon]}
                          value={codeVisible ? draftCode : '•'.repeat(draftCode.length)}
                          editable={false}
                        />
                        <Pressable
                          style={styles.codeEyeBtn}
                          onPress={() => setCodeVisible((v) => !v)}
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name={codeVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={18}
                            color={EMERALD}
                          />
                        </Pressable>
                      </View>
                      <View style={styles.hintActionRow}>
                        <Text style={[styles.subHint, styles.hintFlex]}>
                          यह कोड Family ke sath शेयर करें।
                        </Text>
                        <Pressable style={styles.linkBtnInline} onPress={() => setDraftCode(makeFamilyCode())} accessibilityRole="button">
                          <Text style={styles.linkBtnText}>Generate Code</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Family कोड</Text>
                      <TextInput
                        style={styles.input}
                        value={joinCode}
                        onChangeText={(t) => setJoinCode(t.toUpperCase())}
                        placeholder={`${FAMILY_CODE_LENGTH} अक्षर का कोड`}
                        placeholderTextColor={Colors.placeholderHint}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={FAMILY_CODE_LENGTH}
                      />
                    </>
                  )}

                  <View style={styles.btnRow}>
                    <Pressable
                      style={[styles.primaryBtn, busy && styles.btnDisabled]}
                      onPress={mode === 'create' ? handleCreate : handleJoin}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color={Colors.bgDark} />
                      ) : (
                        <Text style={styles.primaryBtnText}>{mode === 'create' ? 'Family बनाएं' : 'जुड़ें'}</Text>
                      )}
                    </Pressable>
                    <Pressable style={styles.ghostBtn} onPress={resetForm} accessibilityRole="button">
                      <Text style={styles.ghostBtnText}>रुकें</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.warn}>
                    {mode === 'create'
                      ? 'Family बनते ही इस फोन का मौजूदा खर्चा Family में चला जाएगा।'
                      : 'जुड़ते ही Family का सारा खर्चा इस फोन पर आ जाएगा, और आपका मौजूदा खर्चा भी Family में चला जाएगा।'}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.linkedBox}>
              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>Family कोड</Text>
                <Text style={styles.codeValue}>{meta.familyCode}</Text>
              </View>
              <Text style={styles.you}>
                You: {meta.deviceName}
                {meta.role === 'member' ? ' (View Only)' : ''}
              </Text>

              <View style={styles.membersRowInline}>
                <Text style={[styles.label, styles.membersLabel]}>
                  सदस्य ({members ? members.length : 0}):
                </Text>
                {members === null ? (
                  <Text style={styles.subHint}>लोड हो रहा है…</Text>
                ) : members.length === 0 ? (
                  <Text style={styles.subHint}>अभी सिर्फ आप हैं।</Text>
                ) : (
                  <View style={styles.membersChipsInline}>
                    {members.map((m) => (
                      <TouchableOpacity
                        key={m.device_name}
                        style={[styles.chip, m.device_name === meta.deviceName && styles.chipMe]}
                        onPress={() => setShowMembersModal(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, m.device_name === meta.deviceName && styles.chipTextMe]}>
                          {m.device_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.statusRow}>
                <View style={styles.dotWrap}>
                  <View style={[styles.dot, syncing ? styles.dotBusy : styles.dotOn]} />
                  <Text style={styles.statusText}>{syncing ? 'Sync हो रहा है…' : statusText || 'Sync चालू'}</Text>
                </View>
                <Pressable style={styles.ghostBtnSmall} onPress={onSyncNow} disabled={syncing} accessibilityRole="button">
                  <Text style={styles.ghostBtnText}>Sync Now</Text>
                </Pressable>
              </View>

              <TouchableOpacity
                style={styles.showMembersBtnBottom}
                onPress={() => setShowMembersModal(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Ionicons name="people" size={14} color={EMERALD} />
                <Text style={styles.showMembersBtnText}>Show Members</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.hint}>
            Family बनाकर कोड शेयर करें — सदस्य उस कोड से जुड़ें, हर खर्चा सबके फोन पर तुरंत दिखेगा।
          </Text>
        </View>
      </Animated.View>

      {/* ── Show Members Modal ─────────────────────────────────────── */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMembersModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation?.()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="people-circle-outline" size={24} color={EMERALD} />
                <Text style={styles.modalTitle}>Family Members</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowMembersModal(false)}
                hitSlop={10}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableColLeft}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>MEMBER</Text>
              </View>
              <View style={styles.tableColCenter}>
                <Text style={styles.tableHeaderCell}>CODE</Text>
              </View>
              <View style={styles.tableColRight}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>ACTION</Text>
              </View>
            </View>

            {/* Members List Table */}
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {members === null ? (
                <View style={styles.modalEmptyState}>
                  <ActivityIndicator size="small" color={EMERALD} />
                  <Text style={styles.modalEmptyText}>लोड हो रहा है…</Text>
                </View>
              ) : members.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>अभी सिर्फ आप हैं।</Text>
                </View>
              ) : (
                members.map((m) => {
                  const canDelete = meta?.role !== 'member';

                  return (
                    <View key={m.device_name} style={styles.tableRow}>
                      <View style={styles.tableColLeft}>
                        <Text style={[styles.tableNameText, { textAlign: 'left' }]} numberOfLines={1}>
                          {m.device_name}
                        </Text>
                      </View>

                      <View style={styles.tableColCenter}>
                        <Text style={styles.tableCodeText} numberOfLines={1}>
                          {meta?.familyCode || '-'}
                        </Text>
                      </View>

                      <View style={styles.tableColRight}>
                        {canDelete ? (
                          <Pressable
                            style={styles.deleteMemberBtn}
                            onPress={() => setMemberToDelete(m.device_name)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${m.device_name}`}
                          >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                            <Text style={styles.deleteMemberBtnText}>Delete</Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.tableEmptyActionText}>—</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Permanent Delete Confirmation Modal ────────────────────── */}
      <Modal
        visible={!!memberToDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !deletingMember && setMemberToDelete(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !deletingMember && setMemberToDelete(null)}
        >
          <Pressable style={[styles.modalContent, styles.deleteConfirmContent]} onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.deleteWarnIconCircle}>
              <Ionicons name="close-circle-outline" size={34} color="#EF4444" />
            </View>

            <Text style={styles.deleteConfirmTitle}>Permanently Delete</Text>

            <Text style={styles.deleteConfirmText}>
              Are you sure you want to delete member{' '}
              <Text style={styles.deleteHighlight}>{memberToDelete}</Text>?
            </Text>

            <View style={styles.deleteActionRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setMemberToDelete(null)}
                disabled={deletingMember}
                accessibilityRole="button"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmDeleteBtn, deletingMember && { opacity: 0.7 }]}
                onPress={handleConfirmDeleteMember}
                disabled={deletingMember}
                accessibilityRole="button"
              >
                {deletingMember ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.confirmDeleteBtnText}>Delete</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  chevronBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
  },
  // height + opacity come from the animated values at runtime
  body: {
    overflow: 'hidden',
  },
  bodyInner: {
    paddingTop: 8,
    width: '100%',
    flexShrink: 0, // keeps the real height while the body is collapsed to 0
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: 12,
  },
  subHint: {
    fontSize: 11.5,
    lineHeight: 17,
    color: Colors.textDim,
    marginTop: 4,
  },
  warn: {
    fontSize: 11.5,
    lineHeight: 17,
    color: AMBER,
    marginTop: 10,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  codeInput: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    fontSize: 17,
    fontWeight: '800',
    color: EMERALD,
  },
  codeWrap: {
    position: 'relative',
  },
  codeInputWithIcon: {
    paddingRight: 44,
  },
  codeEyeBtn: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 14,
  },
  // Every button in a row gets exactly half the width (flex: 1), so the create
  // /join row, the form row and the leave row all line up with each other.
  primaryBtn: {
    flex: 1,
    backgroundColor: EMERALD,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: Colors.bgDark,
    fontSize: 13.5,
    fontWeight: '800',
  },
  ghostBtn: {
    flex: 1,
    backgroundColor: EMERALD_SOFT,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnSmall: {
    backgroundColor: EMERALD_SOFT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ghostBtnText: {
    color: EMERALD,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 4,
  },
  hintActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  hintFlex: {
    flexShrink: 1,
    marginTop: 0,
  },
  linkBtnInline: {
    paddingVertical: 4,
  },
  linkBtnText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  linkedBox: {
    marginTop: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    color: EMERALD,
  },
  you: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 2,
  },
  membersRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  membersChipsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  showMembersBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  showMembersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  membersLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  membersChips: {
    marginTop: 0,
  },
  chip: {
    backgroundColor: Colors.cardHighlight,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipMe: {
    backgroundColor: EMERALD_SOFT,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextMe: {
    color: EMERALD,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  dotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: EMERALD,
  },
  dotBusy: {
    backgroundColor: AMBER,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },

  // ── Show Members & Delete Confirmation Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalList: {
    maxHeight: 280,
    marginVertical: 4,
  },
  modalEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  modalEmptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  // Members Table UI
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 6,
    marginBottom: 2,
  },
  tableColLeft: {
    flex: 1.2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  tableColCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableColRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  tableCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  tableEmptyActionText: {
    fontSize: 13,
    color: Colors.textDim,
    textAlign: 'right',
  },
  deleteMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 4,
  },
  deleteMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Delete Confirm Modal
  deleteConfirmContent: {
    alignItems: 'center',
    padding: 22,
  },
  deleteWarnIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteConfirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteHighlight: {
    fontWeight: '800',
    color: '#EF4444',
  },
  deleteActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmDeleteBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 11,
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// Family sync card for the Kharcha Tracker: create or join a family, see the
// shared members, and check the sync status.
//
// The card renders nothing at all until the Supabase env vars are present, so
// a build without cloud config is byte-for-byte the old offline app.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { CLOUD_ENABLED, FAMILY_CODE_LENGTH, makeFamilyCode, normalizeFamilyCode } from '../lib/supabaseConfig';
import { cloud } from '../lib/cloudApi';
import { clearMeta, setMeta } from '../lib/kharchaSync';

const EMERALD = '#34D399';
const EMERALD_SOFT = 'rgba(52, 211, 153, 0.14)';
const AMBER = '#FBBF24';

export default function FamilySyncPanel({ meta, statusText, syncing, onMetaChange, onSyncNow }) {
  const [mode, setMode] = useState(null); // 'create' | 'join' | null
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [members, setMembers] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const linked = !!(meta && meta.familyCode);
  const trimmedName = name.trim();

  // Members list is only interesting once a family is linked, and it is set
  // from the async reply only (never synchronously inside the effect).
  useEffect(() => {
    if (!linked) return undefined;
    let alive = true;
    cloud.listMembers(meta.familyCode).then((rows) => {
      if (alive) setMembers(rows);
    });
    return () => {
      alive = false;
    };
  }, [linked, meta]);

  const resetForm = () => {
    setMode(null);
    setName('');
    setJoinCode('');
    setDraftCode('');
    setError('');
    setConfirmLeave(false);
  };

  // ── Create: this phone starts a new family ──────────────────────────────
  const handleCreate = async () => {
    if (!trimmedName) {
      setError('पहले अपना नाम लिखें।');
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
    await clearMeta(); // drop any old family's sync bookkeeping
    const next = await setMeta({ familyCode: code, deviceName: trimmedName, lastPulledAt: 0 });
    setBusy(false);
    onMetaChange(next);
  };

  // ── Join: this phone enters an existing family code ─────────────────────
  const handleJoin = async () => {
    const code = normalizeFamilyCode(joinCode);
    if (!code) {
      setError(`${FAMILY_CODE_LENGTH} अक्षर का कोड डालें (जैसे ABCD2EFG)।`);
      return;
    }
    if (!trimmedName) {
      setError('पहले अपना नाम लिखें।');
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
    await clearMeta();
    const next = await setMeta({ familyCode: code, deviceName: trimmedName, lastPulledAt: 0 });
    setBusy(false);
    onMetaChange(next);
  };

  const handleLeave = async () => {
    await clearMeta();
    setMembers(null);
    onMetaChange(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!CLOUD_ENABLED) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="people-outline" size={18} color={EMERALD} />
        <Text style={styles.title}>Family खर्चा — एक साथ देखें</Text>
      </View>

      {!linked ? (
        <>
          <Text style={styles.hint}>
            Family का कोई भी सदस्य अपना खर्चा जोड़े तो सबके फोन में तुरंत दिखने लगेगा।
            एक फोन Family बनाकर कोड बता दे, बाकी लोग वह कोड डालकर जुड़ जाएँ।
          </Text>

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
                placeholder="जैसे: अंकुर"
                placeholderTextColor={Colors.placeholderHint}
                maxLength={24}
              />

              {mode === 'create' ? (
                <>
                  <Text style={styles.label}>Family कोड</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={draftCode}
                    editable={false}
                  />
                  <Text style={styles.subHint}>
                    यही कोड परिवार के सबको WhatsApp पर बता दें।
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Family कोड</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
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

              {!!error && <Text style={styles.error}>{error}</Text>}

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

              {mode === 'create' && (
                <Pressable style={styles.linkBtn} onPress={() => setDraftCode(makeFamilyCode())} accessibilityRole="button">
                  <Text style={styles.linkBtnText}>दूसरा कोड चाहिए?</Text>
                </Pressable>
              )}

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
          <Text style={styles.you}>आप: {meta.deviceName}</Text>

          <Text style={styles.label}>सदस्य</Text>
          {members === null ? (
            <Text style={styles.subHint}>लोड हो रहा है…</Text>
          ) : members.length === 0 ? (
            <Text style={styles.subHint}>अभी सिर्फ आप हैं।</Text>
          ) : (
            <View style={styles.chips}>
              {members.map((m) => (
                <View key={m.device_name} style={[styles.chip, m.device_name === meta.deviceName && styles.chipMe]}>
                  <Text style={[styles.chipText, m.device_name === meta.deviceName && styles.chipTextMe]}>
                    {m.device_name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.statusRow}>
            <View style={styles.dotWrap}>
              <View style={[styles.dot, syncing ? styles.dotBusy : styles.dotOn]} />
              <Text style={styles.statusText}>{syncing ? 'Sync हो रहा है…' : statusText || 'Sync चालू'}</Text>
            </View>
            <Pressable style={styles.ghostBtnSmall} onPress={onSyncNow} disabled={syncing} accessibilityRole="button">
              <Text style={styles.ghostBtnText}>अभी Sync करें</Text>
            </Pressable>
          </View>

          {confirmLeave ? (
            <View style={styles.leaveRow}>
              <Text style={styles.leaveQues}>Family से हटना है? खर्चा फोन में बना रहेगा, बस आगे से Sync नहीं होगा।</Text>
              <View style={styles.btnRow}>
                <Pressable style={styles.dangerBtn} onPress={handleLeave} accessibilityRole="button">
                  <Text style={styles.dangerBtnText}>हाँ, हट जाएं</Text>
                </Pressable>
                <Pressable style={styles.ghostBtn} onPress={() => setConfirmLeave(false)} accessibilityRole="button">
                  <Text style={styles.ghostBtnText}>नहीं</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.linkBtn} onPress={() => setConfirmLeave(true)} accessibilityRole="button">
              <Text style={styles.linkBtnText}>Family से हटें</Text>
            </Pressable>
          )}
        </View>
      )}
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
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  hint: {
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.textMuted,
    marginBottom: 12,
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
  form: {
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: EMERALD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minWidth: 130,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.bgDark,
    fontSize: 13.5,
    fontWeight: '800',
  },
  ghostBtn: {
    backgroundColor: EMERALD_SOFT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
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
  leaveRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 4,
  },
  leaveQues: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: 8,
  },
  dangerBtn: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dangerBtnText: {
    color: Colors.danger,
    fontSize: 13.5,
    fontWeight: '800',
  },
});

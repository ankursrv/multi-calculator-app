import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Share,
  Platform,
  Alert,
  AppState,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as FsFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import FamilySyncPanel from '../components/FamilySyncPanel';
import GPayLogo from '../components/GPayLogo';
import { CLOUD_ENABLED } from '../lib/supabaseConfig';
import { applyRows, ensureIds, mergeBackup, newEntryId, readMeta, syncOnce } from '../lib/kharchaSync';
import { useAuth } from '../context/AuthContext';

// Animate the backup hint's collapse/expand on Android too (iOS is on by default).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// How often the screen asks the cloud for whatever changed while it was open.
const POLL_MS = 25000;
// Wait after the last local edit before pushing, so typing a list of kharcha
// does not fire one request per entry.
const PUSH_DEBOUNCE_MS = 1200;

// Build a dated backup filename like kharcha-backup-2026-10-27-1430.json
function backupFilename() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `kharcha-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

// A valid backup is a plain object whose values are arrays of entries
function isValidBackup(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  return Object.keys(o).every(
    (k) => /^\d{4}-(1[0-2]|0?[1-9])$/.test(k) && Array.isArray(o[k]),
  );
}

// Summary counts for the restore confirmation
function backupStats(o) {
  let months = 0;
  let entries = 0;
  let total = 0;
  Object.keys(o).forEach((k) => {
    const list = o[k] || [];
    if (list.length > 0) months += 1;
    entries += list.length;
    list.forEach((e) => {
      total += Number(e.cost) || 0;
    });
  });
  return { months, entries, total };
}

const MONTHS_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];
const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = [
  { hi: 'रवि', en: 'Sun' },
  { hi: 'सोम', en: 'Mon' },
  { hi: 'मंगल', en: 'Tue' },
  { hi: 'बुध', en: 'Wed' },
  { hi: 'गुरु', en: 'Thu' },
  { hi: 'शुक्र', en: 'Fri' },
  { hi: 'शनि', en: 'Sat' },
];

const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();
const YEARS = [];
for (let y = THIS_YEAR - 8; y <= THIS_YEAR + 1; y++) YEARS.push(y);

// Month navigation limits (same range as the year dropdown)
const monthIndex = (y, m) => y * 12 + (m - 1);
const IDX_MIN = monthIndex(YEARS[0], 1);
const IDX_MAX = monthIndex(YEARS[YEARS.length - 1], 12);

function fmt(n) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function renderPaymentModeIcon(mode) {
  if (!mode) return null;
  const m = String(mode).trim().toLowerCase();
  if (m === 'upi' || m === 'gpay') {
    return <GPayLogo size={13} style={styles.modeIconRaw} />;
  }
  if (m === 'cash') {
    return <Text style={styles.cashEmoji}>💵</Text>;
  }
  if (m === 'bank') {
    return (
      <MaterialCommunityIcons
        name="bank"
        size={11.5}
        color="#38BDF8"
        style={styles.modeIconRaw}
      />
    );
  }
  return null;
}

export default function KharchaTrackerScreen({ onBack }) {
  const { expensesStorageKey, currentUser, isLoggedIn } = useAuth();
  // { "year-month": [{ id, name, cost, day }] }
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);

  const [selYear, setSelYear] = useState(THIS_YEAR);
  const [selMonth, setSelMonth] = useState(NOW.getMonth() + 1);
  // Entry date — defaults to today while viewing the current month
  const [selDay, setSelDay] = useState(NOW.getDate());

  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');

  const [openDropdown, setOpenDropdown] = useState(null); // 'year' | 'month'
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [yearSummaryOpen, setYearSummaryOpen] = useState(false);
  // Backup hint: collapsed to one line with an inline Read More / Read Less
  const [backupExpanded, setBackupExpanded] = useState(false);
  // Delete/Clear confirmation popup — { type: 'entry'|'month'|'unmarkDay', id?, name?, day? }
  const [confirm, setConfirm] = useState(null);
  // Backup restore confirmation — holds the parsed backup object until confirmed
  const [restoreData, setRestoreData] = useState(null);

  // Settlement & Payment status state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid'
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleTargetDay, setSettleTargetDay] = useState(null); // null = all pending in month, or day number
  const [settleTargetEntryId, setSettleTargetEntryId] = useState(null); // specific entry ID when settling/editing single item
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'UPI' | 'Cash' | 'Bank'
  const [paymentNote, setPaymentNote] = useState('');
  const [activeTooltipId, setActiveTooltipId] = useState(null); // entry ID whose note tooltip is currently visible
  const toggleTooltip = (id) => setActiveTooltipId((prev) => (prev === id ? null : id));

  // Family sync — stays null when no family is linked, and the whole cloud
  // layer then stays out of the picture (pure local behaviour).
  const [cloudMeta, setCloudMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const dataRef = useRef(data);
  const metaRef = useRef(null);
  const busyRef = useRef(false);
  const pushTimerRef = useRef(null);

  // ── Persistence ──────────────────────────────────────────────
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        setLoaded(false);
        const raw = await AsyncStorage.getItem(expensesStorageKey);
        if (!isCancelled) {
          if (raw) setData(JSON.parse(raw));
          else setData({});
          setLoadedKey(expensesStorageKey);
          setLoaded(true);
        }
      } catch (_e) {
        if (!isCancelled) {
          setData({});
          setLoadedKey(expensesStorageKey);
          setLoaded(true);
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [expensesStorageKey]);

  useEffect(() => {
    // Only persist if data was specifically loaded for the current storage key
    if (!loaded || loadedKey !== expensesStorageKey) return;
    AsyncStorage.setItem(expensesStorageKey, JSON.stringify(data)).catch(() => { });
  }, [data, loaded, loadedKey, expensesStorageKey]);

  // ── Family sync plumbing ─────────────────────────────────────────
  // Always read the freshest data through a ref so the background sync never
  // has to re-subscribe on every keystroke.
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Pick up the saved family (and backfill cloud fields on older entries).
  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    (async () => {
      const meta = await readMeta();
      if (!meta) return;
      metaRef.current = meta;
      setCloudMeta(meta);
      setData((prev) => ensureIds(prev, meta.deviceName));
    })();
  }, []);

  // One round trip: send whatever this device changed, then fold in whatever
  // the family changed. Failure is silent by design — unpushed work stays
  // pending in the snapshot diff and is retried on the next tick.
  const runSync = useCallback(async () => {
    const meta = metaRef.current;
    if (!CLOUD_ENABLED || !meta || !meta.familyCode || busyRef.current) return;
    busyRef.current = true;
    setSyncing(true);
    try {
      const result = await syncOnce(dataRef.current, meta);
      // Cursor goes in the ref only. Setting cloudMeta state here would re-run
      // the push effect below (it depends on cloudMeta) and turn the 25s poll
      // into a ~2s loop that also keeps re-arming itself.
      if (result.meta) metaRef.current = result.meta;
      if (result.changed) setData((prev) => applyRows(prev, result.applied));
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setStatusText(
        result.ok
          ? `आख़िरी सिंक ${hh}:${mm}`
          : 'इंटरनेट नहीं — बदलाव क़्यू में हैं',
      );
    } finally {
      setSyncing(false);
      busyRef.current = false;
    }
  }, []);

  // Push shortly after the local data settles. Also fires once when a family
  // link is created or removed via handleMetaChange.
  useEffect(() => {
    if (!CLOUD_ENABLED || !loaded || !cloudMeta) return undefined;
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(runSync, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(pushTimerRef.current);
  }, [data, loaded, cloudMeta, runSync]);

  // Pull continuously while the screen is open, and immediately when the app
  // comes back to the foreground.
  useEffect(() => {
    if (!CLOUD_ENABLED || !cloudMeta) return undefined;
    const id = setInterval(runSync, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSync();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [cloudMeta, runSync]);

  const handleMetaChange = (meta, isNewFamily = false) => {
    metaRef.current = meta;
    setCloudMeta(meta);
    setStatusText('');
    // Joining/create pulls the family history; leaving stops all sync.
    if (meta) {
      setData((prev) => ensureIds(prev, meta.deviceName, isNewFamily));
      clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(runSync, 300);
    }
  };

  // ── Derived state ────────────────────────────────────────────
  const monthKey = `${selYear}-${selMonth}`;
  const entries = useMemo(() => data[monthKey] || [], [data, monthKey]);
  const monthTotal = useMemo(() => entries.reduce((a, e) => a + (Number(e.cost) || 0), 0), [entries]);
  const paidTotal = useMemo(
    () => entries.filter((e) => e.paid).reduce((a, e) => a + (Number(e.cost) || 0), 0),
    [entries],
  );
  const pendingTotal = useMemo(() => monthTotal - paidTotal, [monthTotal, paidTotal]);
  const paidCount = useMemo(() => entries.filter((e) => e.paid).length, [entries]);
  const pendingCount = useMemo(() => entries.length - paidCount, [entries, paidCount]);

  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const firstDayOfWeek = new Date(selYear, selMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isCurrentMonth = selYear === THIS_YEAR && selMonth === NOW.getMonth() + 1;
  const daysWithEntries = useMemo(() => {
    const s = new Set();
    entries.forEach((e) => s.add(e.day));
    return s;
  }, [entries]);

  // Calendar day status: tracks which days have pending vs fully paid entries
  const dayStatusMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      if (!map[e.day]) map[e.day] = { hasPending: false, hasPaid: false };
      if (e.paid) map[e.day].hasPaid = true;
      else map[e.day].hasPending = true;
    });
    return map;
  }, [entries]);

  // Filtered by status (all / pending / paid)
  const filteredEntries = useMemo(() => {
    if (statusFilter === 'pending') return entries.filter((e) => !e.paid);
    if (statusFilter === 'paid') return entries.filter((e) => e.paid);
    return entries;
  }, [entries, statusFilter]);

  // Days sorted newest-first; includes paid/pending metrics per day
  const dayGroups = useMemo(() => {
    const map = {};
    filteredEntries.forEach((e) => {
      (map[e.day] = map[e.day] || []).push(e);
    });
    return Object.keys(map)
      .map(Number)
      .sort((a, b) => b - a)
      .map((d) => {
        const items = map[d];
        const sub = items.reduce((a, e) => a + (Number(e.cost) || 0), 0);
        const isAllPaid = items.length > 0 && items.every((e) => e.paid);
        const isAnyPaid = items.some((e) => e.paid);
        return {
          day: d,
          items,
          sub,
          isAllPaid,
          isPartiallyPaid: isAnyPaid && !isAllPaid,
          paidSub: items.filter((e) => e.paid).reduce((a, e) => a + (Number(e.cost) || 0), 0),
          pendingSub: items.filter((e) => !e.paid).reduce((a, e) => a + (Number(e.cost) || 0), 0),
        };
      });
  }, [filteredEntries]);

  const targetEntry = useMemo(() => {
    if (!settleTargetEntryId) return null;
    return entries.find((e) => e.id === settleTargetEntryId) || null;
  }, [entries, settleTargetEntryId]);

  // For settle modal: amount and count of items being settled
  const targetSettleAmount = useMemo(() => {
    if (targetEntry) {
      return Number(targetEntry.cost) || 0;
    }
    if (settleTargetDay !== null) {
      return entries
        .filter((e) => e.day === settleTargetDay && !e.paid)
        .reduce((a, e) => a + (Number(e.cost) || 0), 0);
    }
    return pendingTotal;
  }, [entries, settleTargetDay, targetEntry, pendingTotal]);

  const targetSettleCount = useMemo(() => {
    if (targetEntry) {
      return 1;
    }
    if (settleTargetDay !== null) {
      return entries.filter((e) => e.day === settleTargetDay && !e.paid).length;
    }
    return pendingCount;
  }, [entries, settleTargetDay, targetEntry, pendingCount]);

  const yearRows = useMemo(() => {
    const totals = [];
    for (let m = 1; m <= 12; m++) {
      const list = data[`${selYear}-${m}`] || [];
      totals.push({ month: m, sum: list.reduce((a, e) => a + e.cost, 0) });
    }
    const max = Math.max(...totals.map((t) => t.sum), 1);
    const yearTotal = totals.reduce((a, t) => a + t.sum, 0);
    return { totals, max, yearTotal };
  }, [data, selYear]);

  // ── Actions ──────────────────────────────────────────────────
  const pickYear = (y) => {
    setSelYear(y);
    setSelDay(y === THIS_YEAR && selMonth === NOW.getMonth() + 1 ? NOW.getDate() : 1);
    setOpenDropdown(null);
  };

  const pickMonth = (m) => {
    setSelMonth(m);
    setSelDay(m === NOW.getMonth() + 1 && selYear === THIS_YEAR ? NOW.getDate() : 1);
    setOpenDropdown(null);
  };

  const pickDay = (d) => {
    setSelDay(d);
    setDayPickerOpen(false);
  };

  // Prev / next month inside the calendar (keeps the picker open)
  const currentIdx = monthIndex(selYear, selMonth);
  const canGoPrev = currentIdx > IDX_MIN;
  const canGoNext = currentIdx < IDX_MAX;

  const goMonth = (delta) => {
    const nextIdx = currentIdx + delta;
    if (nextIdx < IDX_MIN || nextIdx > IDX_MAX) return;
    const y = Math.floor(nextIdx / 12);
    const m = (nextIdx % 12) + 1;
    const maxDay = new Date(y, m, 0).getDate();
    const isNowMonth = y === THIS_YEAR && m === NOW.getMonth() + 1;
    setSelYear(y);
    setSelMonth(m);
    // keep the chosen day when it exists, otherwise fall back to a valid one
    setSelDay((d) => (d > maxDay ? (isNowMonth ? NOW.getDate() : maxDay) : d));
  };

  const handleAdd = () => {
    const cost = parseFloat(itemCost);
    const name = itemName.trim();
    if (!name || !cost || cost <= 0) return;
    const entry = {
      id: newEntryId(),
      name,
      cost,
      day: selDay,
      paid: false,
      addedBy: cloudMeta ? cloudMeta.deviceName : '',
      updatedAt: Date.now(),
    };
    setData((prev) => ({ ...prev, [monthKey]: [entry, ...(prev[monthKey] || [])] }));
    setItemName('');
    setItemCost('');
  };

  // Modal openers
  const openSettleModalForMonth = () => {
    setSettleTargetDay(null);
    setSettleTargetEntryId(null);
    setPaymentMode('UPI');
    setPaymentNote('');
    setSettleModalOpen(true);
  };

  const openSettleModalForDay = (day) => {
    setSettleTargetDay(day);
    setSettleTargetEntryId(null);
    setPaymentMode('UPI');
    setPaymentNote('');
    setSettleModalOpen(true);
  };

  const openSettleModalForEntry = (entry) => {
    setSettleTargetEntryId(entry.id);
    setSettleTargetDay(null);
    setPaymentMode(entry.paymentMode || 'UPI');
    setPaymentNote(entry.paymentNote || '');
    setSettleModalOpen(true);
  };

  // Toggle single item paid status
  const handleToggleEntryPaid = (id) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    if (entry.paid) {
      // If already paid -> toggle off to unpaid
      setData((prev) => {
        const list = prev[monthKey] || [];
        return {
          ...prev,
          [monthKey]: list.map((e) => {
            if (e.id !== id) return e;
            return {
              ...e,
              paid: false,
              paidAt: null,
              paymentMode: null,
              paymentNote: '',
              updatedAt: Date.now(),
            };
          }),
        };
      });
    } else {
      // Unpaid -> open payment modal so user can pick GPay, Cash, or Bank!
      openSettleModalForEntry(entry);
    }
  };

  // Toggle all items on a day
  const handleToggleDayPaid = (day, targetPaid) => {
    setData((prev) => {
      const list = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: list.map((e) => {
          if (e.day !== day) return e;
          return {
            ...e,
            paid: targetPaid,
            paidAt: targetPaid ? Date.now() : null,
            paymentMode: targetPaid ? (e.paymentMode || 'UPI') : null,
            paymentNote: targetPaid ? (e.paymentNote || '') : '',
            updatedAt: Date.now(),
          };
        }),
      };
    });
  };

  // Settle target (all pending, specific day, or single entry)
  const closeSettleModal = () => {
    setSettleModalOpen(false);
    setSettleTargetDay(null);
    setSettleTargetEntryId(null);
    setPaymentNote('');
  };

  const doSettle = () => {
    const now = Date.now();
    setData((prev) => {
      const list = prev[monthKey] || [];
      return {
        ...prev,
        [monthKey]: list.map((e) => {
          if (settleTargetEntryId !== null) {
            if (e.id !== settleTargetEntryId) return e;
          } else if (settleTargetDay !== null) {
            if (e.day !== settleTargetDay) return e;
            if (e.paid) return e;
          } else {
            if (e.paid) return e;
          }
          return {
            ...e,
            paid: true,
            paidAt: e.paidAt || now,
            paymentMode,
            paymentNote: paymentNote.trim(),
            updatedAt: now,
          };
        }),
      };
    });
    closeSettleModal();
  };

  const handleDelete = (id) => {
    const entry = entries.find((e) => e.id === id);
    setConfirm({ type: 'entry', id, name: entry ? entry.name : '' });
  };

  const handleClearMonth = () => {
    setConfirm({ type: 'month' });
  };

  const doConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'entry') {
      setData((prev) => ({
        ...prev,
        [monthKey]: (prev[monthKey] || []).filter((e) => e.id !== confirm.id),
      }));
    } else if (confirm.type === 'unmarkDay') {
      handleToggleDayPaid(confirm.day, false);
    } else {
      setData((prev) => {
        const next = { ...prev };
        delete next[monthKey];
        return next;
      });
    }
    setConfirm(null);
  };

  const handleShare = async () => {
    if (entries.length === 0) return;
    const pendingList = entries.filter((e) => !e.paid);
    const paidList = entries.filter((e) => e.paid);

    let text = `📒 *Daily Expenses — ${MONTHS_HI[selMonth - 1]} ${selYear}*\n`;
    text += `════════════════════════════════\n`;

    if (pendingList.length > 0) {
      text += `⏳ *बाकी हिसाब (Pending Dues): ${fmt(pendingTotal)}*\n`;
      const pendingMap = {};
      pendingList.forEach((e) => {
        (pendingMap[e.day] = pendingMap[e.day] || []).push(e);
      });
      Object.keys(pendingMap)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach((d) => {
          text += `📅 ${d} ${MONTHS_EN[selMonth - 1]}:\n`;
          pendingMap[d].forEach((e) => {
            text += `   • ${e.name}: ${fmt(e.cost)}\n`;
          });
        });
      text += `────────────────────────────────\n`;
    }

    if (paidList.length > 0) {
      text += `✓ *चुकता हिसाब (Paid / Settled): ${fmt(paidTotal)}*\n`;
      const paidMap = {};
      paidList.forEach((e) => {
        (paidMap[e.day] = paidMap[e.day] || []).push(e);
      });
      Object.keys(paidMap)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach((d) => {
          text += `📅 ${d} ${MONTHS_EN[selMonth - 1]}:\n`;
          paidMap[d].forEach((e) => {
            const noteSuffix = e.paymentNote
              ? ` [${e.paymentMode || 'Paid'} - "${e.paymentNote}"]`
              : e.paymentMode
                ? ` [${e.paymentMode}]`
                : '';
            text += `   • ${e.name}: ${fmt(e.cost)}${noteSuffix}\n`;
          });
        });
      text += `────────────────────────────────\n`;
    }

    text += `*महीने का कुल खर्चा: ${fmt(monthTotal)}* (${entries.length} entries)\n`;
    if (pendingTotal > 0) {
      text += `*बकाया राशि: ${fmt(pendingTotal)}*\n`;
    } else {
      text += `*सारा हिसाब चुकता है ✅*\n`;
    }
    try {
      await Share.share({ message: text });
    } catch (_e) {
      // user dismissed
    }
  };

  // "Kisne add kiya" — rendered inline so the existing row layout does not shift at all.
  const byline = (e) =>
    cloudMeta && e.addedBy ? (
      <Text style={styles.itemByline}> · {e.addedBy}</Text>
    ) : null;

  const dayPillLabel =
    isCurrentMonth && selDay === NOW.getDate()
      ? 'Today'
      : `${selDay} ${MONTHS_EN[selMonth - 1]}`;

  // ── Backup & Restore ─────────────────────────────────────────
  const totalEntryCount = useMemo(
    () => Object.values(data).reduce((a, list) => a + (list ? list.length : 0), 0),
    [data],
  );

  // Toggle the backup hint; LayoutAnimation smooths the height change natively.
  const toggleBackupHint = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(240, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    setBackupExpanded((v) => !v);
  };

  const backupHintText =
    'बैकअप फाइल में आपका सारा खर्चा सेव हो जाता है। यह फाइल WhatsApp या Google Drive में भेजकर रख लें — नया फोन लेने पर या ऐप डिलीट होने पर इसी फाइल से सारा डेटा वापस आ जाएगा।';

  const handleBackup = async () => {
    if (totalEntryCount === 0) {
      Alert.alert('कुछ बैकअप नहीं', 'पहले कोई खर्चा जोड़ें, फिर बैकअप फाइल बनेगी।');
      return;
    }
    const json = JSON.stringify(data, null, 2);
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = backupFilename();
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      const file = new FsFile(Paths.cache, backupFilename());
      file.create({ overwrite: true, intermediates: true });
      await file.write(json);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('बैकअप सेव नहीं हुआ', 'इस फोन में फाइल शेयर करना उपलब्ध नहीं है।');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Kharcha बैकअप सेव करें',
        UTI: 'public.json',
      });
    } catch (e) {
      Alert.alert('बैकअप नहीं बना', e && e.message ? String(e.message) : 'कोई दिक्कत आ गई, दोबारा कोशिश करें।');
    }
  };

  const readBackupText = async () => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = window.document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json,text/plain';
        input.onchange = (ev) => {
          const f = ev.target.files && ev.target.files[0];
          if (!f) {
            resolve(null);
            return;
          }
          const reader = new window.FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => resolve(null);
          reader.readAsText(f);
        };
        input.click();
      });
    }
    const pick = await FsFile.pickFileAsync({
      mimeTypes: ['application/json', 'text/json', 'text/plain', 'application/octet-stream'],
    });
    if (pick.canceled || !pick.result) return null;
    return pick.result.text();
  };

  const handleRestore = async () => {
    try {
      const text = await readBackupText();
      if (!text) return;
      const parsed = JSON.parse(text);
      if (!isValidBackup(parsed)) {
        Alert.alert('गलत फाइल', 'यह फाइल Daily Expenses का सही बैकअप नहीं लग रही।');
        return;
      }
      setRestoreData(parsed);
    } catch (_e) {
      Alert.alert(
        'Restore नहीं हुआ',
        'फाइल पढ़ी नहीं जा सकी। सुनिश्चित करें कि चुनी गई फाइल .json बैकअप है।',
      );
    }
  };

  const doRestore = () => {
    if (!restoreData) return;
    // Linked to a family: merge by entry id so the restore cannot wipe what the
    // others have added. Not linked: load the file exactly as it is.
    setData((prev) => (cloudMeta ? mergeBackup(prev, restoreData, cloudMeta.deviceName) : restoreData));
    setRestoreData(null);
    setYearSummaryOpen(false);
    Alert.alert('डेटा वापस आ गया ✅', 'बैकअप से सारा खर्चा फोन में लाद दिया गया है।');
  };

  const restoreStats = restoreData ? backupStats(restoreData) : null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Daily Expenses"
        subtitle={
          isLoggedIn && currentUser
            ? `${currentUser.name || 'User'}'s Personal Expenses`
            : 'Track Month-by-Month Expenses'
        }
        icon="notebook-outline"
        theme="emerald"
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Year / Month segmented selector (pehle saal, fir mahina) */}
        <View style={styles.monthBar}>
          <View style={styles.segmentWrap}>
            <TouchableOpacity
              style={styles.segment}
              onPress={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
              activeOpacity={0.7}
            >
              <View style={styles.segmentValueRow}>
                <Text style={styles.segmentValue}>{selYear}</Text>
                <View style={styles.chevronDown} />
              </View>
            </TouchableOpacity>

            <View style={styles.segmentDivider} />

            <TouchableOpacity
              style={styles.segment}
              onPress={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              activeOpacity={0.7}
            >
              <View style={styles.segmentValueRow}>
                <Text style={styles.segmentValue}>{MONTHS_HI[selMonth - 1]}</Text>
                <View style={styles.chevronDown} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card — month total + Settlement Overview */}
        <LinearGradient
          colors={['#34D399', '#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroWatermark} numberOfLines={1}>
            ₹
          </Text>

          <Text style={styles.heroLabel}>
            {MONTHS_HI[selMonth - 1]} {selYear} का कुल खर्चा
          </Text>
          <Text style={styles.heroTotal}>{fmt(monthTotal)}</Text>

          {/* Paid vs Pending Breakdown Pills inside Hero */}
          {entries.length > 0 && (
            <View style={styles.heroBreakdownContainer}>
              <View style={styles.heroStatBox}>
                <View style={styles.heroStatHeader}>
                  <View style={styles.heroGreenDot} />
                  <Text style={styles.heroStatLabel}>Paid</Text>
                </View>
                <Text style={styles.heroStatValue}>{fmt(paidTotal)}</Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatBox}>
                <View style={styles.heroStatHeader}>
                  <View style={styles.heroAmberDot} />
                  <Text style={styles.heroStatLabel}>Pending</Text>
                </View>
                <Text style={styles.heroStatValue}>{fmt(pendingTotal)}</Text>
              </View>
            </View>
          )}

          <View style={styles.heroFooter}>
            <Text style={styles.heroItemCount}>
              {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
              {entries.length > 0 && ` · ${paidCount} Paid`}
            </Text>

            {pendingTotal > 0 ? (
              <TouchableOpacity
                style={styles.heroSettleBtn}
                onPress={openSettleModalForMonth}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={13} color="#022C22" />
                <Text style={styles.heroSettleBtnText}>Settle Due</Text>
              </TouchableOpacity>
            ) : entries.length > 0 ? (
              <View style={styles.allSettledPill}>
                <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                <Text style={styles.allSettledText}>All Settled 🎉</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        {/* Add Expense Card with date pill */}
        <View style={styles.card}>
          <View style={styles.addHead}>
            <Text style={styles.cardTitle}>Add Expense</Text>
            <TouchableOpacity
              style={styles.datePill}
              onPress={() => setDayPickerOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={15} color="#34D399" />
              <Text style={styles.datePillText}>{dayPillLabel}</Text>
              <View style={styles.chevronDownSmall} />
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, styles.itemInput]}
              value={itemName}
              onChangeText={setItemName}
              placeholder="Add Items..."
              placeholderTextColor="rgb(100, 116, 139)"
            />
            <View style={styles.inputPrefixWrap}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                style={[styles.input, styles.costInput]}
                value={itemCost}
                onChangeText={setItemCost}
                keyboardType="decimal-pad"
                placeholder="Cost"
                placeholderTextColor="rgb(100, 116, 139)"
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color="#022C22" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Entries Card */}
        <View style={styles.card}>
          <View style={styles.listHeader}>
            <Text style={styles.cardTitle}>
              Total Entries ({entries.length})
            </Text>
            {entries.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.actionPill} onPress={handleShare} accessibilityLabel="Share">
                  <Ionicons name="share-social-outline" size={20} color="#34D399" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearPill} onPress={handleClearMonth} accessibilityLabel="Clear">
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Status Filter Tabs (सब / बाकी / चुकता) */}
          {entries.length > 0 && (
            <View style={styles.filterTabsRow}>
              <TouchableOpacity
                style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
                onPress={() => setStatusFilter('all')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, statusFilter === 'all' && styles.filterTabTextActive]}>
                  All ({entries.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  statusFilter === 'pending' && styles.filterTabActivePending,
                ]}
                onPress={() => setStatusFilter('pending')}
                activeOpacity={0.8}
              >
                <View style={styles.pendingDot} />
                <Text
                  style={[
                    styles.filterTabText,
                    statusFilter === 'pending' && styles.filterTabTextActivePending,
                  ]}
                >
                  Pending ({pendingCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  statusFilter === 'paid' && styles.filterTabActivePaid,
                ]}
                onPress={() => setStatusFilter('paid')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color={statusFilter === 'paid' ? '#022C22' : '#34D399'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    statusFilter === 'paid' && styles.filterTabTextActivePaid,
                  ]}
                >
                  Paid ({paidCount})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {entries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="book-outline" size={40} color={Colors.textDim} />
              <Text style={styles.emptyText}>
                {MONTHS_HI[selMonth - 1]} {selYear} me abhi kharcha nahi hai.
              </Text>
              <Text style={styles.emptySub}>
                Upar se saman aur kiमत likh ke + dabao.
              </Text>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name={statusFilter === 'pending' ? 'checkmark-done-circle-outline' : 'hourglass-outline'}
                size={40}
                color={statusFilter === 'pending' ? '#34D399' : Colors.amber}
              />
              <Text style={styles.emptyText}>
                {statusFilter === 'pending'
                  ? 'बधाई हो! कोई बाकी हिसाब नहीं है 🎉'
                  : 'अभी तक कोई चुकता हिसाब नहीं है'}
              </Text>
              <Text style={styles.emptySub}>
                {statusFilter === 'pending'
                  ? 'इस महीने का सारा खर्चा चुकता हो चुका है।'
                  : 'जब आप भुगतान करेंगे, यहाँ चुकता रिकॉर्ड दिखेगा।'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.entriesScroll}
              contentContainerStyle={styles.entriesScrollContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              {...(Platform.OS === 'web'
                ? {
                  onTouchStart: (e) => e.stopPropagation(),
                  onTouchMove: (e) => e.stopPropagation(),
                }
                : {})}
            >
              {dayGroups.map((g, index) => {
                const prevGroup = index > 0 ? dayGroups[index - 1] : null;
                const isMilestone =
                  statusFilter === 'all' &&
                  g.isAllPaid &&
                  prevGroup &&
                  !prevGroup.isAllPaid &&
                  pendingTotal > 0;
                const bannerNote = g.items.find((item) => item.paymentNote)?.paymentNote || '';

                return (
                  <React.Fragment key={`day-wrap-${g.day}`}>
                    {isMilestone && (
                      <View style={styles.settlementBanner}>
                        <View style={styles.settlementBannerLine} />
                        <View style={styles.settlementBannerBadge}>
                          <Ionicons name="checkmark-done-circle" size={15} color="#34D399" />
                          <Text style={styles.settlementBannerText}>यहाँ तक का हिसाब चुकता है (Settled)</Text>
                          {bannerNote ? (
                            <View style={styles.bannerNotePill}>
                              <Ionicons name="chatbubble-ellipses-outline" size={10} color="#FBBF24" />
                              <Text style={styles.bannerNoteText} numberOfLines={1}>
                                {bannerNote}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.settlementBannerLine} />
                      </View>
                    )}

                    {g.items.length === 1 ? (
                      // Single item on this day → flat row with check button & paid badge
                      <View key={`day-${g.day}`} style={[styles.entryRow, g.items[0].paid && styles.entryRowPaid]}>
                        <TouchableOpacity
                          style={[styles.paidToggleCircle, g.items[0].paid && styles.paidToggleCircleActive]}
                          onPress={() => handleToggleEntryPaid(g.items[0].id)}
                          activeOpacity={0.7}
                        >
                          {g.items[0].paid ? (
                            <Ionicons name="checkmark" size={13} color="#022C22" />
                          ) : (
                            <View style={styles.paidToggleCircleDot} />
                          )}
                        </TouchableOpacity>

                        <View style={[styles.dateBadge, g.items[0].paid && styles.dateBadgePaid]}>
                          <Text style={[styles.dateBadgeDay, g.items[0].paid && styles.dateBadgeDayPaid]}>
                            {g.day}
                          </Text>
                          <Text style={styles.dateBadgeMon}>{MONTHS_EN[selMonth - 1]}</Text>
                        </View>

                        <View style={styles.entryInfoWrap}>
                          <Text
                            style={[styles.entryName, g.items[0].paid && styles.entryNamePaid]}
                            numberOfLines={1}
                          >
                            {g.items[0].name}
                            {byline(g.items[0])}
                          </Text>
                          {g.items[0].paid ? (
                            <View style={styles.entryPaidCol}>
                              <View style={styles.paidBadgeInlineWrap}>
                                <TouchableOpacity
                                  style={styles.paidBadgeInline}
                                  onPress={() => openSettleModalForEntry(g.items[0])}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.paidBadgeInlineText}>Paid</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    g.items[0].paymentNote
                                      ? toggleTooltip(g.items[0].id)
                                      : openSettleModalForEntry(g.items[0])
                                  }
                                  activeOpacity={0.7}
                                >
                                  {renderPaymentModeIcon(g.items[0].paymentMode || 'UPI')}
                                </TouchableOpacity>
                                {g.items[0].paymentNote ? (
                                  <TouchableOpacity
                                    onPress={() => toggleTooltip(g.items[0].id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons
                                      name={
                                        activeTooltipId === g.items[0].id
                                          ? 'chatbubble-ellipses'
                                          : 'chatbubble-ellipses-outline'
                                      }
                                      size={11}
                                      color="#FBBF24"
                                      style={styles.noteIndicatorIcon}
                                    />
                                  </TouchableOpacity>
                                ) : null}
                              </View>
                              {activeTooltipId === g.items[0].id && g.items[0].paymentNote ? (
                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  onPress={() => setActiveTooltipId(null)}
                                  style={styles.noteTooltipWrap}
                                >
                                  <View style={styles.noteTooltipArrow} />
                                  <View style={styles.noteTooltipBubble}>
                                    <Text style={styles.noteTooltipText}>{g.items[0].paymentNote}</Text>
                                  </View>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          ) : (
                            <Text style={styles.pendingBadgeInlineText}>Pending</Text>
                          )}
                        </View>

                        <Text style={[styles.entryCost, g.items[0].paid && styles.entryCostPaid]}>
                          {fmt(g.items[0].cost)}
                        </Text>

                        <TouchableOpacity
                          style={styles.delBtn}
                          onPress={() => handleDelete(g.items[0].id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color="#F87171" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      // Multiple items on this day → grouped card with day total & settlement actions
                      <View key={`day-${g.day}`} style={[styles.dayGroup, g.isAllPaid && styles.dayGroupPaid]}>
                        <View style={styles.dayHead}>
                          <View style={[styles.dateBadge, g.isAllPaid && styles.dateBadgePaid]}>
                            <Text style={[styles.dateBadgeDay, g.isAllPaid && styles.dateBadgeDayPaid]}>
                              {g.day}
                            </Text>
                            <Text style={styles.dateBadgeMon}>{MONTHS_EN[selMonth - 1]}</Text>
                          </View>

                          <View style={styles.dayHeadInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.dayHeadCount}>
                                {g.items.length} {g.items.length === 1 ? 'Item' : 'Items'}
                              </Text>

                              {/* Status Tag / Action on Day Card */}
                              {g.isAllPaid ? (
                                <TouchableOpacity
                                  style={styles.dayPaidTag}
                                  onPress={() => setConfirm({ type: 'unmarkDay', day: g.day })}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="checkmark-circle" size={12} color="#34D399" />
                                  <Text style={styles.dayPaidTagText}>Paid</Text>
                                </TouchableOpacity>
                              ) : g.isPartiallyPaid ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                  <View style={styles.dayPartialTag}>
                                    <Text style={styles.dayPartialTagText}>Partial</Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.daySettleQuickBtn}
                                    onPress={() => openSettleModalForDay(g.day)}
                                    activeOpacity={0.8}
                                  >
                                    <Ionicons name="checkmark" size={11} color="#022C22" />
                                    <Text style={styles.daySettleQuickText}>Settle Due</Text>
                                  </TouchableOpacity>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.daySettleQuickBtn}
                                  onPress={() => openSettleModalForDay(g.day)}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="checkmark" size={11} color="#022C22" />
                                  <Text style={styles.daySettleQuickText}>Settle</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          <View style={[styles.dayHeadTotalWrap, g.isAllPaid && styles.dayHeadTotalWrapPaid]}>
                            <Text style={[styles.dayHeadTotal, g.isAllPaid && styles.dayHeadTotalPaid]}>
                              {fmt(g.sub)}
                            </Text>
                          </View>
                        </View>

                        {g.items.map((e, idx) => (
                          <View
                            key={e.id}
                            style={[
                              styles.itemRow,
                              idx === g.items.length - 1 && styles.itemRowLast,
                              e.paid && styles.itemRowPaid,
                            ]}
                          >
                            <TouchableOpacity
                              style={[styles.itemCheckCircle, e.paid && styles.itemCheckCircleActive]}
                              onPress={() => handleToggleEntryPaid(e.id)}
                              activeOpacity={0.7}
                            >
                              {e.paid ? (
                                <Ionicons name="checkmark" size={11} color="#022C22" />
                              ) : (
                                <View style={styles.itemCheckCircleDot} />
                              )}
                            </TouchableOpacity>

                            <View style={styles.itemTextWrap}>
                              <Text
                                style={[styles.itemName, e.paid && styles.itemNamePaid]}
                                numberOfLines={1}
                              >
                                {e.name}
                                {byline(e)}
                              </Text>
                              {e.paid && (
                                <View style={styles.itemPaidMetaContainer}>
                                  <View style={styles.itemPaidMetaRow}>
                                    <TouchableOpacity
                                      style={styles.itemPaidMetaInline}
                                      onPress={() => openSettleModalForEntry(e)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.itemPaidMeta}>Paid</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() =>
                                        e.paymentNote
                                          ? toggleTooltip(e.id)
                                          : openSettleModalForEntry(e)
                                      }
                                      activeOpacity={0.7}
                                    >
                                      {renderPaymentModeIcon(e.paymentMode || 'UPI')}
                                    </TouchableOpacity>
                                    {e.paymentNote ? (
                                      <TouchableOpacity
                                        onPress={() => toggleTooltip(e.id)}
                                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                        activeOpacity={0.7}
                                      >
                                        <Ionicons
                                          name={
                                            activeTooltipId === e.id
                                              ? 'chatbubble-ellipses'
                                              : 'chatbubble-ellipses-outline'
                                          }
                                          size={11}
                                          color="#FBBF24"
                                          style={styles.noteIndicatorIcon}
                                        />
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                  {activeTooltipId === e.id && e.paymentNote ? (
                                    <TouchableOpacity
                                      activeOpacity={0.9}
                                      onPress={() => setActiveTooltipId(null)}
                                      style={styles.noteTooltipWrap}
                                    >
                                      <View style={styles.noteTooltipArrow} />
                                      <View style={styles.noteTooltipBubble}>
                                        <Text style={styles.noteTooltipText}>{e.paymentNote}</Text>
                                      </View>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              )}
                            </View>

                            <Text style={[styles.itemCost, e.paid && styles.itemCostPaid]}>
                              {fmt(e.cost)}
                            </Text>

                            <TouchableOpacity
                              style={styles.delBtn}
                              onPress={() => handleDelete(e.id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={15} color="#F87171" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Yearly Summary toggle */}
        <TouchableOpacity
          style={styles.yearToggleBtn}
          onPress={() => setYearSummaryOpen((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons name="bar-chart-outline" size={16} color="#34D399" />
          <Text style={styles.yearToggleText}>साल दर साल हिसाब (Yearly Summary)</Text>
          <Ionicons
            name={yearSummaryOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#34D399"
          />
        </TouchableOpacity>

        {yearSummaryOpen && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{selYear} का मासिक हिसाब:</Text>
            {yearRows.totals.map((t) => (
              <View
                key={t.month}
                style={[
                  styles.yRow,
                  t.month === selMonth && styles.yRowCurrent,
                ]}
              >
                <Text style={styles.yRowLabel}>{MONTHS_HI[t.month - 1]}</Text>
                <View style={styles.barWrap}>
                  <LinearGradient
                    colors={['#34D399', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      ...styles.bar,
                      width: `${Math.max((t.sum / yearRows.max) * 100, t.sum > 0 ? 4 : 0)}%`,
                    }}
                  />
                </View>
                <Text style={styles.yRowAmount}>{t.sum > 0 ? fmt(t.sum) : '—'}</Text>
              </View>
            ))}
            <View style={styles.yTotalRow}>
              <Text style={styles.yTotalLabel}>साल का कुल खर्चा</Text>
              <Text style={styles.yTotalValue}>{fmt(yearRows.yearTotal)}</Text>
            </View>
          </View>
        )}

        {/* Family sync */}
        <FamilySyncPanel
          meta={cloudMeta}
          statusText={statusText}
          syncing={syncing}
          onMetaChange={handleMetaChange}
          onSyncNow={runSync}
        />

        {/* Data Backup & Restore */}
        <View style={styles.card}>
          <View style={styles.backupHead}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#34D399" />
            <Text style={styles.cardTitle}>डेटा बैकअप और रिस्टोर</Text>
          </View>
          <View style={styles.backupHintWrap}>
            {backupExpanded ? (
              <Text style={styles.backupHint}>
                {backupHintText}
                {'  '}
                <Text style={styles.readMoreText} onPress={toggleBackupHint}>
                  Read Less
                </Text>
              </Text>
            ) : (
              <View style={styles.backupHintRow}>
                <Text style={[styles.backupHint, styles.backupHintFlex]} numberOfLines={1}>
                  {backupHintText}
                </Text>
                <Text style={styles.readMoreText} onPress={toggleBackupHint}>
                  Read More
                </Text>
              </View>
            )}
          </View>
          <View style={styles.backupBtnRow}>
            <TouchableOpacity style={styles.backupBtn} onPress={handleBackup} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={18} color="#34D399" />
              <Text style={styles.backupBtnText}>बैकअप फाइल बनाएं</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.85}>
              <Ionicons name="cloud-upload-outline" size={18} color="#FBBF24" />
              <Text style={styles.restoreBtnText}>बैकअप से Restore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Year / Month dropdown modal */}
      <Modal
        visible={openDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenDropdown(null)}
      >
        <TouchableWithoutFeedback onPress={() => setOpenDropdown(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropPanel}>
                <Text style={styles.dropTitle}>
                  {openDropdown === 'year' ? 'Select Year' : 'Select Month'}
                </Text>
                <ScrollView style={styles.dropScroll}>
                  {openDropdown === 'year' &&
                    YEARS.map((y) => {
                      const hasData = MONTHS_HI.some(
                        (_, i) => (data[`${y}-${i + 1}`] || []).length > 0,
                      );
                      return (
                        <TouchableOpacity
                          key={y}
                          style={[styles.dropOption, y === selYear && styles.dropOptionActive]}
                          onPress={() => pickYear(y)}
                        >
                          <Text
                            style={[
                              styles.dropOptionText,
                              y === selYear && styles.dropOptionTextActive,
                            ]}
                          >
                            {y}
                          </Text>
                          {y === selYear ? (
                            <Ionicons name="checkmark" size={16} color="#34D399" />
                          ) : hasData ? (
                            <View style={styles.dataDot} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}

                  {openDropdown === 'month' &&
                    MONTHS_HI.map((m, i) => {
                      const hasData = (data[`${selYear}-${i + 1}`] || []).length > 0;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.dropOption,
                            i + 1 === selMonth && styles.dropOptionActive,
                          ]}
                          onPress={() => pickMonth(i + 1)}
                        >
                          <Text
                            style={[
                              styles.dropOptionText,
                              i + 1 === selMonth && styles.dropOptionTextActive,
                            ]}
                          >
                            {m}
                          </Text>
                          {i + 1 === selMonth ? (
                            <Ionicons name="checkmark" size={16} color="#34D399" />
                          ) : hasData ? (
                            <View style={styles.dataDot} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Day grid modal (custom date for back-dated entries) */}
      <Modal
        visible={dayPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDayPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDayPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dayPanel}>
                <View style={styles.dayHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropTitle}>Entry की तारीख चुनें</Text>
                    {/* Month + year with prev / next navigation */}
                    <View style={styles.monthNavRow}>
                      <TouchableOpacity
                        style={[styles.monthNavBtn, !canGoPrev && styles.monthNavBtnOff]}
                        onPress={() => goMonth(-1)}
                        disabled={!canGoPrev}
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={17}
                          color={canGoPrev ? '#34D399' : Colors.textDim}
                        />
                      </TouchableOpacity>

                      <Text style={styles.dropSubTitle}>
                        {MONTHS_HI[selMonth - 1]} {selYear}
                      </Text>

                      <TouchableOpacity
                        style={[styles.monthNavBtn, !canGoNext && styles.monthNavBtnOff]}
                        onPress={() => goMonth(1)}
                        disabled={!canGoNext}
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={17}
                          color={canGoNext ? '#34D399' : Colors.textDim}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.dayCloseBtn}
                    onPress={() => setDayPickerOpen(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Weekdays Header (Sun to Sat) */}
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((w, idx) => (
                    <View key={w.en} style={styles.weekdayCell}>
                      <Text style={[styles.weekdayText, idx === 0 && styles.weekdaySunday]}>
                        {w.hi}
                      </Text>
                      <Text style={[styles.weekdaySub, idx === 0 && styles.weekdaySundaySub]}>
                        {w.en}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* 7-Column Days Grid */}
                <View style={styles.dayGrid}>
                  {/* Empty slots before first day */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <View key={`empty-start-${i}`} style={styles.dayCellWrap} />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isToday = isCurrentMonth && d === NOW.getDate();
                    const isActive = d === selDay;
                    const isSunday = (firstDayOfWeek + d - 1) % 7 === 0;
                    const hasData = daysWithEntries.has(d);
                    return (
                      <View key={d} style={styles.dayCellWrap}>
                        <TouchableOpacity
                          style={[
                            styles.dayCell,
                            isActive && styles.dayCellActive,
                            isToday && !isActive && styles.dayCellToday,
                          ]}
                          onPress={() => pickDay(d)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              isSunday && !isActive && styles.dayCellTextSunday,
                              isActive && styles.dayCellTextActive,
                            ]}
                          >
                            {d}
                          </Text>
                          {hasData && (
                            <View
                              style={[
                                styles.dayDot,
                                dayStatusMap[d]?.hasPending ? styles.dayDotPending : styles.dayDotPaid,
                                isActive && styles.dayDotActive,
                              ]}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* Trailing empty slots to complete the final row */}
                  {Array.from({
                    length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7,
                  }).map((_, i) => (
                    <View key={`empty-end-${i}`} style={styles.dayCellWrap} />
                  ))}
                </View>

                {/* Footer with Today shortcut */}
                <View style={styles.dayFooterRow}>
                  <TouchableOpacity
                    style={styles.dayTodayBtn}
                    onPress={() => {
                      if (!isCurrentMonth) {
                        setSelYear(THIS_YEAR);
                        setSelMonth(NOW.getMonth() + 1);
                      }
                      pickDay(NOW.getDate());
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="today-outline" size={14} color="#34D399" />
                    <Text style={styles.dayTodayBtnText}>
                      आज ({NOW.getDate()} {MONTHS_EN[NOW.getMonth()]})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete / Clear / Unmark confirmation popup */}
      <Modal
        visible={confirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirm(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmPanel}>
                <View
                  style={[
                    styles.confirmIconWrap,
                    confirm?.type === 'unmarkDay' && styles.confirmIconWrapAmber,
                  ]}
                >
                  <Ionicons
                    name={confirm?.type === 'unmarkDay' ? 'alert-circle-outline' : 'trash-outline'}
                    size={26}
                    color={confirm?.type === 'unmarkDay' ? '#FBBF24' : '#F87171'}
                  />
                </View>
                <Text style={styles.confirmTitle}>
                  {confirm?.type === 'entry'
                    ? 'Entry डिलीट करें?'
                    : confirm?.type === 'unmarkDay'
                      ? 'हिसाब वापस बाकी करें?'
                      : 'पूरे महीने का रिकॉर्ड मिटाएं?'}
                </Text>
                <Text style={styles.confirmMsg}>
                  {confirm?.type === 'entry'
                    ? `"${confirm.name}" वाली यह entry delete हो जाएगी। यह वापस नहीं आएगी।`
                    : confirm?.type === 'unmarkDay'
                      ? `${confirm.day} ${MONTHS_EN[selMonth - 1]} का हिसाब चुकता से वापस बाकी (Pending) में बदल जाएगा।`
                      : `${MONTHS_HI[selMonth - 1]} ${selYear} की सारी entries delete हो जाएँगी। यह वापस नहीं मिलेगी।`}
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setConfirm(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>रुको ✋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmDangerBtn,
                      confirm?.type === 'unmarkDay' && styles.confirmAmberBtn,
                    ]}
                    onPress={doConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDangerText}>
                      {confirm?.type === 'entry'
                        ? 'हाँ, डिलीट करें'
                        : confirm?.type === 'unmarkDay'
                          ? 'हाँ, बाकी करें'
                          : 'हाँ, मिटाएं'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Settle Balance Modal */}
      <Modal
        visible={settleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSettleModal}
      >
        <TouchableWithoutFeedback onPress={closeSettleModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.settlePanel}>
                <View style={styles.settleIconWrap}>
                  <Ionicons name="shield-checkmark" size={28} color="#34D399" />
                </View>

                <Text style={styles.settleTitle}>हिसाब चुकता करें</Text>
                <Text style={styles.settleSubTitle}>
                  {targetEntry
                    ? `"${targetEntry.name}" का भुगतान दर्ज करें`
                    : settleTargetDay !== null
                    ? `${settleTargetDay} ${MONTHS_EN[selMonth - 1]} का बकाया भुगतान दर्ज करें`
                    : `${MONTHS_HI[selMonth - 1]} ${selYear} का कुल बकाया भुगतान दर्ज करें`}
                </Text>

                <View style={styles.settleAmountBox}>
                  <Text style={styles.settleAmountLabel}>
                    {targetEntry ? 'भुगतान राशि (Amount)' : 'कुल बकाया राशि (Total Due)'}
                  </Text>
                  <Text style={styles.settleAmountValue}>
                    {fmt(targetSettleAmount)}
                  </Text>
                  <Text style={styles.settleCountBadge}>
                    {targetSettleCount} {targetSettleCount === 1 ? 'Item' : 'Items'} चुकता होंगे
                  </Text>
                </View>

                {/* Payment Mode Selector */}
                <Text style={styles.settleSectionLabel}>भुगतान का माध्यम (Payment Mode):</Text>
                <View style={styles.settleModesRow}>
                  {[
                    { key: 'UPI', label: 'UPI / GPay', type: 'gpay' },
                    { key: 'Cash', label: 'नकद (Cash)', type: 'emoji', emoji: '💵' },
                    { key: 'Bank', label: 'बैंक (Bank)', type: 'mci', icon: 'bank', size: 13, color: '#38BDF8' },
                  ].map((m) => {
                    const isActive = paymentMode === m.key;
                    const iconColor = isActive ? '#022C22' : (m.color || '#34D399');
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[
                          styles.settleModePill,
                          isActive && styles.settleModePillActive,
                        ]}
                        onPress={() => setPaymentMode(m.key)}
                        activeOpacity={0.8}
                      >
                        {m.type === 'gpay' ? (
                          <GPayLogo size={14} />
                        ) : m.type === 'emoji' ? (
                          <Text style={styles.settleModeEmoji}>{m.emoji}</Text>
                        ) : (
                          <MaterialCommunityIcons name={m.icon} size={m.size} color={iconColor} />
                        )}
                        <Text
                          style={[
                            styles.settleModePillText,
                            isActive && styles.settleModePillTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Optional note */}
                <TextInput
                  style={styles.settleNoteInput}
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  placeholder="नोट (वैकल्पिक, उदा: Bhaiya ko cash diye)..."
                  placeholderTextColor={Colors.textDim}
                />

                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={closeSettleModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>रुको ✋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settleConfirmBtn}
                    onPress={doSettle}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={17} color="#022C22" />
                    <Text style={styles.settleConfirmBtnText}>भुगतान दर्ज करें</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Backup restore confirmation popup */}
      <Modal
        visible={restoreData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreData(null)}
      >
        <TouchableWithoutFeedback onPress={() => setRestoreData(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.confirmPanel}>
                <View style={styles.restoreIconWrap}>
                  <Ionicons name="refresh-outline" size={26} color="#34D399" />
                </View>
                <Text style={styles.confirmTitle}>बैकअप से डेटा लाएं?</Text>
                <Text style={styles.confirmMsg}>
                  इस बैकअप में {restoreStats ? restoreStats.months : 0} महीने,{' '}
                  {restoreStats ? restoreStats.entries : 0} entries और कुल{' '}
                  {restoreStats ? fmt(restoreStats.total) : '₹0'} है।{'\n'}
                  Restore करने पर फोन का मौजूदा सारा खर्चा मिट जाएगा और सिर्फ यही बैकअप
                  लोड होगा।
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setRestoreData(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>रुको ✋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmRestoreBtn}
                    onPress={doRestore}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmRestoreText}>हाँ, Restore करें</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 80,
  },

  // Year / Month segmented selector
  monthBar: {
    marginBottom: 14,
  },
  segmentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingVertical: 7,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  segmentDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.cardBorder,
  },
  segmentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Bold chevron (same › shape, thicker stroke)
  chevronDown: {
    width: 7,
    height: 7,
    borderRightWidth: 2.2,
    borderBottomWidth: 2.2,
    borderColor: '#34D399',
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  chevronDownSmall: {
    width: 6,
    height: 6,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#34D399',
    transform: [{ rotate: '45deg' }],
    marginTop: -2.5,
  },
  segmentValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },

  // Hero
  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroWatermark: {
    position: 'absolute',
    right: -6,
    bottom: -30,
    fontSize: 130,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.13)',
    lineHeight: 140,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 4,
  },
  heroTotal: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroItemCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '700',
  },

  // Generic card
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  addHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },

  // Date pill
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },

  // Add form
  formRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  itemInput: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    outlineStyle: 'none',
  },
  inputPrefixWrap: {
    width: 72,
    position: 'relative',
    justifyContent: 'center',
  },
  costInput: {
    paddingLeft: 18,
    paddingRight: 4,
    fontSize: 13.5,
  },
  prefix: {
    position: 'absolute',
    left: 6,
    zIndex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
  },
  addBtn: {
    backgroundColor: '#34D399',
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Entries
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionPill: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 100,
  },
  clearPill: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: 100,
  },
  entriesScroll: {
    maxHeight: 280,
    ...(Platform.OS === 'web'
      ? {
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }
      : {}),
  },
  entriesScrollContent: {
    paddingBottom: 4,
  },

  // Date badge (shared)
  dateBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeDay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  dateBadgeMon: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  // Single-item flat row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(52, 211, 153, 0.45)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  entryName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text,
  },
  entryCost: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
  },

  // Multi-item day card
  dayGroup: {
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(52, 211, 153, 0.45)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 211, 153, 0.18)',
  },
  dayHeadInfo: {
    flex: 1,
  },
  dayHeadCount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  dayHeadSub: {
    fontSize: 10.5,
    color: Colors.textDim,
    fontWeight: '600',
    marginTop: 1,
  },
  dayHeadTotalWrap: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  dayHeadTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34D399',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.7)',
  },
  itemRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6EE7B7',
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  itemByline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  itemCost: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.text,
  },

  // Delete button (trash)
  delBtn: {
    width: 18,
    height: 18,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  // Yearly summary
  yearToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  yearToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
  },
  yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    gap: 8,
  },
  yRowCurrent: {
    backgroundColor: 'rgba(52, 211, 153, 0.07)',
    borderRadius: 8,
  },
  yRowLabel: {
    width: 66,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  barWrap: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.cardBgSolid,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  yRowAmount: {
    width: 68,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  yTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  yTotalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.text,
  },
  yTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34D399',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // Delete / Clear confirmation popup
  confirmPanel: {
    width: 300,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmMsg: {
    fontSize: 12.5,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  confirmCancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  confirmDangerBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.danger,
  },
  confirmDangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dropPanel: {
    width: 240,
    maxHeight: 380,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 10,
  },
  dropTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dropScroll: {
    maxHeight: 320,
  },
  dropOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dropOptionActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
  },
  dropOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dropOptionTextActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  dataDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.amber,
  },

  // Day grid
  dayPanel: {
    width: '92%',
    maxWidth: 340,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 18,
    padding: 14,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 211, 153, 0.12)',
  },
  dropSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    minWidth: 96,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
    paddingLeft: 8,
  },
  monthNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.28)',
  },
  monthNavBtnOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: Colors.inputBorder,
    opacity: 0.45,
  },
  dayCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52, 211, 153, 0.1)',
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  weekdaySunday: {
    color: '#F87171',
  },
  weekdaySub: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  weekdaySundaySub: {
    color: 'rgba(248, 113, 113, 0.7)',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellWrap: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2.5,
  },
  dayCell: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    position: 'relative',
  },
  dayCellActive: {
    backgroundColor: '#34D399',
    borderColor: '#059669',
  },
  dayCellToday: {
    borderColor: Colors.amber,
    borderWidth: 1.5,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayCellTextSunday: {
    color: '#FCA5A5',
  },
  dayCellTextActive: {
    color: '#022C22',
    fontWeight: '900',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
    position: 'absolute',
    bottom: 2.5,
  },
  dayDotActive: {
    backgroundColor: '#022C22',
  },
  dayFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.12)',
  },
  dayTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  dayTodayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },

  // Backup & Restore card
  backupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  backupHint: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textDim,
    fontWeight: '600',
  },
  backupHintWrap: {
    marginBottom: 14,
  },
  backupHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  backupHintFlex: {
    flex: 1,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  backupBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  backupBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#34D399',
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  restoreBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FBBF24',
  },
  backupCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDim,
    marginTop: 12,
    textAlign: 'center',
  },

  // Restore confirmation
  restoreIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmRestoreBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  confirmRestoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Hero Breakdown & Settle Button ──
  heroBreakdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  heroGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6EE7B7',
  },
  heroAmberDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FDE047',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroSettleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  heroSettleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  allSettledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  allSettledText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Status Filter Tabs ──
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(11, 15, 25, 0.6)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  filterTabActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  filterTabActivePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  filterTabActivePaid: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  filterTabTextActivePending: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  filterTabTextActivePaid: {
    color: '#34D399',
    fontWeight: '800',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },

  // ── Settlement Timeline Milestone Banner ──
  settlementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  settlementBannerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(52, 211, 153, 0.28)',
  },
  settlementBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 78, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  settlementBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  bannerNotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  bannerNoteText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FDE047',
    maxWidth: 120,
  },

  // ── Paid/Pending Card & Row Styling ──
  entryRowPaid: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(11, 15, 25, 0.45)',
  },
  dayGroupPaid: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(11, 15, 25, 0.45)',
  },
  paidToggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
  },
  paidToggleCircleActive: {
    backgroundColor: '#34D399',
    borderColor: '#059669',
  },
  paidToggleCircleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.textDim,
  },
  dateBadgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  dateBadgeDayPaid: {
    color: '#6EE7B7',
  },
  entryInfoWrap: {
    flex: 1,
  },
  entryNamePaid: {
    color: Colors.textMuted,
  },
  entryCostPaid: {
    color: 'rgba(52, 211, 153, 0.75)',
  },
  paidBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  paidBadgeInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  pendingBadgeInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 2,
  },
  dayPaidTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  dayPaidTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  dayPartialTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  dayPartialTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
  },
  daySettleQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#34D399',
    borderRadius: 8,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
  },
  daySettleQuickText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#022C22',
  },
  dayHeadTotalWrapPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  dayHeadTotalPaid: {
    color: '#6EE7B7',
  },
  itemRowPaid: {
    opacity: 0.85,
  },
  itemCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
  },
  itemCheckCircleActive: {
    backgroundColor: '#34D399',
    borderColor: '#059669',
  },
  itemCheckCircleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textDim,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemNamePaid: {
    color: Colors.textMuted,
  },
  itemCostPaid: {
    color: 'rgba(52, 211, 153, 0.75)',
  },
  itemPaidMeta: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#34D399',
  },
  itemPaidMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  modeIconRaw: {
    marginLeft: 3,
  },
  cashEmoji: {
    fontSize: 11,
    lineHeight: 13,
    marginLeft: 3,
  },
  settleModeEmoji: {
    fontSize: 13,
    lineHeight: 15,
  },
  paidBadgeInlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  itemPaidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 1,
  },
  entryPaidCol: {
    marginTop: 2,
  },
  itemPaidMetaContainer: {
    marginTop: 1,
  },
  noteIndicatorIcon: {
    marginLeft: 3,
  },
  noteTooltipWrap: {
    marginTop: 3,
    alignSelf: 'flex-start',
    maxWidth: '96%',
    zIndex: 10,
  },
  noteTooltipArrow: {
    width: 0,
    height: 0,
    marginLeft: 55,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(251, 191, 36, 0.45)',
  },
  noteTooltipBubble: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  noteTooltipText: {
    fontSize: 10.5,
    lineHeight: 14,
    color: '#FDE68A',
    fontWeight: '500',
    flexShrink: 1,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  notePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FBBF24',
    maxWidth: 140,
  },

  // ── Confirmation Modal Amber Style ──
  confirmIconWrapAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  confirmAmberBtn: {
    backgroundColor: '#D97706',
  },

  // ── Calendar Dots ──
  dayDotPending: {
    backgroundColor: '#F59E0B',
  },
  dayDotPaid: {
    backgroundColor: '#34D399',
  },

  // ── Settle Balance Modal Styles ──
  settlePanel: {
    width: 320,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  settleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  settleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  settleSubTitle: {
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    marginBottom: 14,
  },
  settleAmountBox: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  settleAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  settleAmountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#34D399',
  },
  settleCountBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 2,
  },
  settleSectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  settleModesRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  settleModePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  settleModePillActive: {
    backgroundColor: '#34D399',
    borderColor: '#059669',
  },
  settleModePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  settleModePillTextActive: {
    color: '#022C22',
    fontWeight: '900',
  },
  settleNoteInput: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.text,
    marginBottom: 16,
  },
  settleConfirmBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#34D399',
  },
  settleConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#022C22',
  },
});

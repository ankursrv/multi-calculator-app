import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

const STORAGE_KEY = 'kharchaTrackerData';

const MONTHS_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];
const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();
const YEARS = [];
for (let y = THIS_YEAR - 8; y <= THIS_YEAR + 1; y++) YEARS.push(y);

function fmt(n) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function KharchaTrackerScreen({ onBack }) {
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
  // Delete/Clear confirmation popup — { type: 'entry'|'month', id?, name? }
  const [confirm, setConfirm] = useState(null);

  // ── Persistence ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setData(JSON.parse(raw));
      } catch (e) {
        // first run / corrupt data — start fresh
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  // ── Derived state ────────────────────────────────────────────
  const monthKey = `${selYear}-${selMonth}`;
  const entries = data[monthKey] || [];
  const monthTotal = entries.reduce((a, e) => a + e.cost, 0);
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const isCurrentMonth = selYear === THIS_YEAR && selMonth === NOW.getMonth() + 1;

  // Days sorted newest-first; 1 item = flat row, 2+ = grouped card
  const dayGroups = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      (map[e.day] = map[e.day] || []).push(e);
    });
    return Object.keys(map)
      .map(Number)
      .sort((a, b) => b - a)
      .map((d) => ({
        day: d,
        items: map[d],
        sub: map[d].reduce((a, e) => a + e.cost, 0),
      }));
  }, [entries]);

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

  const handleAdd = () => {
    const cost = parseFloat(itemCost);
    const name = itemName.trim();
    if (!name || !cost || cost <= 0) return;
    const entry = { id: Date.now().toString(), name, cost, day: selDay };
    setData((prev) => ({ ...prev, [monthKey]: [entry, ...(prev[monthKey] || [])] }));
    setItemName('');
    setItemCost('');
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
    let text = `📒 *Kharcha Tracker — ${MONTHS_HI[selMonth - 1]} ${selYear}*\n`;
    text += `--------------------------------\n`;
    dayGroups.forEach((g) => {
      text += `📅 ${g.day} ${MONTHS_EN[selMonth - 1]}\n`;
      g.items.forEach((e) => {
        text += `   • ${e.name}: ${fmt(e.cost)}\n`;
      });
      if (g.items.length > 1) text += `   ↳ दिन का कुल: ${fmt(g.sub)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*महीने का कुल खर्चा: ${fmt(monthTotal)}* (${entries.length} entries)\n`;
    try {
      await Share.share({ message: text });
    } catch (e) {
      // user dismissed
    }
  };

  const dayPillLabel =
    isCurrentMonth && selDay === NOW.getDate()
      ? 'Today'
      : `${selDay} ${MONTHS_EN[selMonth - 1]}`;

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Kharcha Tracker"
        subtitle="महीने-दर-महीने खर्चा का हिसाब"
        icon="notebook-outline"
        theme="emerald"
        onBack={onBack}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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

        {/* Hero Card — month total */}
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
          <View style={styles.heroFooter}>
            <Text style={styles.heroItemCount}>
              {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
            </Text>
          </View>
        </LinearGradient>

        {/* Add Expense Card with date pill */}
        <View style={styles.card}>
          <View style={styles.addHead}>
            <Text style={styles.cardTitle}>खर्चा जोड़ें (Add Expense):</Text>
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
              Entries ({entries.length})
            </Text>
            {entries.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.actionPill} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={14} color="#34D399" />
                  <Text style={styles.actionPillText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearPill} onPress={handleClearMonth}>
                  <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                  <Text style={styles.clearPillText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
          ) : (
            <ScrollView style={styles.entriesScroll} showsVerticalScrollIndicator={false}>
              {dayGroups.map((g) =>
                g.items.length === 1 ? (
                  // Single item on this day → flat row
                  <View key={`day-${g.day}`} style={styles.entryRow}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeDay}>{g.day}</Text>
                      <Text style={styles.dateBadgeMon}>{MONTHS_EN[selMonth - 1]}</Text>
                    </View>
                    <Text style={styles.entryName} numberOfLines={1}>
                      {g.items[0].name}
                    </Text>
                    <Text style={styles.entryCost}>{fmt(g.items[0].cost)}</Text>
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => handleDelete(g.items[0].id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Multiple items on this day → grouped card with day total
                  <View key={`day-${g.day}`} style={styles.dayGroup}>
                    <View style={styles.dayHead}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeDay}>{g.day}</Text>
                        <Text style={styles.dateBadgeMon}>{MONTHS_EN[selMonth - 1]}</Text>
                      </View>
                      <View style={styles.dayHeadInfo}>
                        <Text style={styles.dayHeadCount}>
                          {g.items.length} {g.items.length === 1 ? 'Item' : 'Items'}
                        </Text>
                        <Text style={styles.dayHeadSub}>इस दिन का कुल</Text>
                      </View>
                      <View style={styles.dayHeadTotalWrap}>
                        <Text style={styles.dayHeadTotal}>{fmt(g.sub)}</Text>
                      </View>
                    </View>
                    {g.items.map((e, idx) => (
                      <View
                        key={e.id}
                        style={[
                          styles.itemRow,
                          idx === g.items.length - 1 && styles.itemRowLast,
                        ]}
                      >
                        <View style={styles.itemBullet} />
                        <Text style={styles.itemName} numberOfLines={1}>
                          {e.name}
                        </Text>
                        <Text style={styles.itemCost}>{fmt(e.cost)}</Text>
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
                ),
              )}
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
                <Text style={styles.dropTitle}>
                  Entry की तारीख चुनें — {MONTHS_HI[selMonth - 1]} {selYear}
                </Text>
                <View style={styles.dayGrid}>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isToday = isCurrentMonth && d === NOW.getDate();
                    const isActive = d === selDay;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dayCell,
                          isActive && styles.dayCellActive,
                          isToday && !isActive && styles.dayCellToday,
                        ]}
                        onPress={() => pickDay(d)}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isActive && styles.dayCellTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete / Clear confirmation popup */}
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
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="trash-outline" size={26} color="#F87171" />
                </View>
                <Text style={styles.confirmTitle}>
                  {confirm?.type === 'entry' ? 'Entry डिलीट करें?' : 'पूरे महीने का रिकॉर्ड मिटाएं?'}
                </Text>
                <Text style={styles.confirmMsg}>
                  {confirm?.type === 'entry'
                    ? `"${confirm.name}" वाली यह entry delete हो जाएगी। यह वापस नहीं आएगी।`
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
                    style={styles.confirmDangerBtn}
                    onPress={doConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDangerText}>
                      {confirm?.type === 'entry' ? 'हाँ, डिलीट करें' : 'हाँ, मिटाएं'}
                    </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '700',
  },
  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearPillText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '700',
  },
  entriesScroll: {
    maxHeight: 260,
  },

  // Date badge (shared)
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeDay: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
    lineHeight: 17,
  },
  dateBadgeMon: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Single-item flat row
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: 14,
    fontWeight: '700',
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
    paddingLeft: 12,
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
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemCost: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.text,
  },

  // Delete button (trash)
  delBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
    width: 280,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 12,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '12.5%',
    aspectRatio: 1,
    margin: '1.07%',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayCellTextActive: {
    color: '#022C22',
    fontWeight: '900',
  },
});

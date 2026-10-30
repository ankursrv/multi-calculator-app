import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

// Empty state me dikhane wala "ise use kaise kare" hint
const HOW_TO_SUMMARY =
  'दोस्तों के साथ खाना खाया, बिल आया ₹900 — यहाँ सामान की entries जोड़ें, कुल बिल अपने-आप जुड़ जाएगा। अब स्प्लिट में 3 चुनें तो हर किसी का हिस्सा ₹300 दिखेगा, और Share से पूरा हिसाब WhatsApp पर भेज दें।';

export default function SmartKhataScreen({ billList = [], onClearBill, onRemoveItem, onAddItem, onBack }) {
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [splitCount, setSplitCount] = useState('2');

  // Delete/Clear confirmation popup — { type: 'item'|'all', index?, name? }
  const [confirm, setConfirm] = useState(null);

  const handleClearAll = () => {
    setConfirm({ type: 'all' });
  };

  const handleRemoveItem = (index) => {
    const item = billList[index];
    setConfirm({ type: 'item', index, name: item ? item.name : '' });
  };

  const doConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'item') {
      onRemoveItem(confirm.index);
    } else {
      onClearBill();
    }
    setConfirm(null);
  };

  const handleAdd = () => {
    if (!itemCost || parseFloat(itemCost) <= 0) return;
    onAddItem({
      id: Date.now().toString(),
      name: itemName.trim() || `Item #${billList.length + 1}`,
      details: 'Manual Entry',
      result: `₹${parseFloat(itemCost).toFixed(2)}`,
      cost: parseFloat(itemCost),
    });
    setItemName('');
    setItemCost('');
  };

  const totalBill = billList.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const people = parseInt(splitCount) || 1;
  const perPerson = totalBill / people;
  const hasItems = billList.length > 0;

  const handleShare = async () => {
    if (billList.length === 0) return;
    let text = `🛒 *MultiCalc - Kirana Bill Summary*\n------------------------------\n`;
    billList.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.details}): ${item.result}\n`;
    });
    text += `------------------------------\n*Total Bill: ₹${totalBill.toFixed(2)}*\n`;
    if (people > 1) {
      text += `*Split among ${people} people: ₹${perPerson.toFixed(2)} each*\n`;
    }
    try {
      await Share.share({ message: text });
    } catch (e) {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header with subtle shadow fade */}
      <ScreenHeader
        title="Smart Khata"
        subtitle="सामान की लिस्ट, कुल बिल एवं स्प्लिट हिसाब"
        icon="book-account"
        onBack={onBack}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Bill Hero Card */}
        <LinearGradient
          colors={Colors.gradientCardColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>कुल बिल रकम (Total Bill Amount):</Text>
          <Text style={styles.heroTotal}>₹{totalBill.toFixed(2)}</Text>
          {hasItems && (
            <View style={styles.heroFooter}>
              <Text style={styles.heroItemCount}>{billList.length} Items Listed</Text>
              {people > 1 && (
                <Text style={styles.heroSplit}>₹{perPerson.toFixed(2)} / person ({people})</Text>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Quick Add Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>सामान जोड़ें (Quick Add Item):</Text>
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
                keyboardType="numeric"
                placeholder="रुपये"
                placeholderTextColor="rgb(100, 116, 139)"
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color="#030712" />
            </TouchableOpacity>
          </View>

          {/* Split Calculator */}
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>बिल बांटें (Split among people):</Text>
            <View style={styles.splitControls}>
              {['1', '2', '3', '4', '5'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.splitChip, splitCount === num && styles.splitChipActive]}
                  onPress={() => setSplitCount(num)}
                >
                  <Text
                    style={[
                      styles.splitChipText,
                      splitCount === num && styles.splitChipTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <View style={styles.listHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitleInline}>Bill Items</Text>
              {hasItems && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{billList.length}</Text>
                </View>
              )}
            </View>
            {hasItems && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.actionPill} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={14} color={Colors.amber} />
                  <Text style={styles.actionPillText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearPill} onPress={handleClearAll}>
                  <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                  <Text style={styles.clearPillText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!hasItems ? (
            /* Abhi koi entry nahi — sirf use karne ka tarika hint ki tarah dikhta hai */
            <View style={styles.howToBox}>
              <View style={styles.howToHead}>
                <Ionicons name="help-circle-outline" size={15} color={Colors.textDim} />
                <Text style={styles.howToHeadText}>Ise use kaise karein?</Text>
              </View>
              <Text style={styles.howToText}>{HOW_TO_SUMMARY}</Text>
            </View>
          ) : (
            billList.map((item, index) => (
              <View key={item.id || index} style={styles.billItem}>
                <View style={styles.itemIndex}>
                  <Text style={styles.indexNum}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billItemName}>{item.name}</Text>
                  <Text style={styles.billItemDetails}>{item.details}</Text>
                </View>
                <Text style={styles.billItemCost}>₹{item.cost?.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(index)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={19} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
                  {confirm?.type === 'item' ? 'Item डिलीट करें?' : 'पूरा बिल मिटाएं?'}
                </Text>
                <Text style={styles.confirmMsg}>
                  {confirm?.type === 'item'
                    ? `"${confirm.name}" वाली यह item list से delete हो जाएगी। यह वापस नहीं आएगी।`
                    : 'सारी Bill Items delete हो जाएँगी। यह वापस नहीं मिलेगी।'}
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
                      {confirm?.type === 'item' ? 'हाँ, डिलीट करें' : 'हाँ, मिटाएं'}
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
  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  heroTotal: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroItemCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  heroSplit: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
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
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleInline: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  // Entry count — sirf tabhi dikhta hai jab koi entry ho
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.amber,
  },
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
    color: Colors.amber,
  },
  addBtn: {
    backgroundColor: Colors.amber,
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  splitControls: {
    flexDirection: 'row',
    gap: 6,
  },
  splitChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 15, 25, 0.8)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.amber,
  },
  splitChipText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  splitChipTextActive: {
    color: Colors.amber,
  },
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11,
    color: Colors.amber,
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
  // Empty state — dashed "placeholder" zone with usage steps
  howToBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    borderRadius: 14,
    backgroundColor: 'rgba(11, 15, 25, 0.35)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  howToHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  howToHeadText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  howToText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: Colors.textDim,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
    gap: 10,
  },
  itemIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  billItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  billItemDetails: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  billItemCost: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.amber,
  },
  deleteBtn: {
    padding: 4,
  },
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
});

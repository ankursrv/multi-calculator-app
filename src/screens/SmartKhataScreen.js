import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function SmartKhataScreen({ billList = [], onClearBill, onRemoveItem, onAddItem }) {
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [splitCount, setSplitCount] = useState('2');

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
        title="Kirana Smart Khata"
        subtitle="सामान की लिस्ट, कुल बिल एवं स्प्लिट हिसाब"
        icon="book-account"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Bill Hero Card */}
      <LinearGradient
        colors={Colors.gradientCardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroLabel}>कुल पर्चा राशि (Total Bill Amount):</Text>
        <Text style={styles.heroTotal}>₹{totalBill.toFixed(2)}</Text>
        <View style={styles.heroFooter}>
          <Text style={styles.heroItemCount}>{billList.length} Items Listed</Text>
          {people > 1 && (
            <Text style={styles.heroSplit}>₹{perPerson.toFixed(2)} / person ({people})</Text>
          )}
        </View>
      </LinearGradient>

      {/* Quick Add Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>सामान जोड़ें (Quick Add Item):</Text>
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1.5 }]}
            value={itemName}
            onChangeText={setItemName}
            placeholder="Item (e.g. Aata, Tel, Sabzi)"
            placeholderTextColor={Colors.textDim}
          />
          <View style={[styles.inputPrefixWrap, { flex: 1 }]}>
            <Text style={styles.prefix}>₹</Text>
            <TextInput
              style={[styles.input, { paddingLeft: 26 }]}
              value={itemCost}
              onChangeText={setItemCost}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={Colors.textDim}
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
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
          <Text style={styles.cardTitle}>Bill Items ({billList.length})</Text>
          {billList.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.actionPill} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={14} color={Colors.amber} />
                <Text style={styles.actionPillText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearPill} onPress={onClearBill}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={styles.clearPillText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {billList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>अभी कोई सामान नहीं जोड़ा गया है।</Text>
            <Text style={styles.emptySub}>
              "Samaan-Bhav & Kirana" कैलकुलेटर से सीधे हिसाब यहाँ सेव कर सकते हैं।
            </Text>
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
                onPress={() => onRemoveItem(index)}
                style={styles.deleteBtn}
              >
                <Ionicons name="close-circle-outline" size={20} color={Colors.textDim} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  formRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  inputPrefixWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  prefix: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.amber,
  },
  addBtn: {
    backgroundColor: Colors.amber,
    width: 44,
    height: 44,
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
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
});

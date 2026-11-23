import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function CrossingTrainAlert({ crossing, onPress }) {
  const train = crossing.train;
  const live = crossing.live;
  const isStation = crossing.type === 'station';

  const delayColor = live.delayMin > 10 ? Colors.danger : live.delayMin > 0 ? Colors.orange : Colors.success;
  const statusText =
    live.status === 'Running'
      ? 'Running'
      : live.status === 'At Station' || live.status === 'At Station (Halting)'
        ? 'At Station'
        : live.status === 'Reached Destination'
          ? 'Reached Destination'
          : 'Scheduled';

  const eta = live.etaNextStation
    ? new Date(live.etaNextStation).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#0B1220', '#151016']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {/* Left icon zone */}
        <View style={styles.iconZone}>
          <MaterialCommunityIcons
            name={isStation ? 'train' : 'train-variant'}
            size={26}
            color="#F59E0B"
            style={styles.icon}
          />
          {isStation && (
            <View style={styles.stationBadge}>
              <Text style={styles.stationBadgeText}>{crossing.stationCode}</Text>
            </View>
          )}
        </View>

        {/* Right content */}
        <View style={styles.content}>
          <View style={styles.trainHeader}>
            <Text style={styles.trainNumber}>{train.trainNumber}</Text>
            <Text style={styles.trainTypeBadge}>{crossing.type === 'station' ? 'STATION CROSSING' : 'TRACK CROSSING'}</Text>
          </View>
          <Text style={styles.trainName}>{train.trainName}</Text>
          <Text style={styles.routeText}>
            {train.origin} → {train.destination}
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { borderColor: delayColor }]}>
              <View style={[styles.statusDot, { backgroundColor: delayColor }]} />
              <Text style={[styles.statusText, { color: delayColor }]}>{statusText}</Text>
            </View>
            {live.delayMin !== 0 && (
              <View style={styles.delayPill}>
                <Ionicons name="alert-circle" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.delayText}>{live.delayMin > 0 ? `+${live.delayMin} min` : `${live.delayMin} min`}</Text>
              </View>
            )}
            <Text style={styles.etaText}>ETA: {eta}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="alert-outline" size={14} color="#F59E0B" style={styles.detailIcon} />
            <Text style={styles.detailText}>{crossing.detail}</Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#64748B" style={styles.arrow} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconZone: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginRight: 14,
  },
  icon: {},
  stationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  stationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  trainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  trainNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  trainTypeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  trainName: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  routeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  delayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  delayText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  etaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {},
  detailText: {
    color: '#FB923C',
    fontSize: 11,
    fontWeight: '600',
  },
  arrow: {},
});

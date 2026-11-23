import React, { useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

export default function TrainRouteMap({ train, live, crossings, showCrossings = true }) {
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const route = useMemo(() => train.route || [], [train]);
  const animValueRef = useRef(new Animated.Value(0));

  // Animate train along the route based on live progress
  useEffect(() => {
    const target = live ? Math.round(live.progress * 100) / 100 : 0;
    Animated.timing(animValueRef.current, {
      toValue: target,
      duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [live, animValueRef]);

  // Pre-compute station positions
  const stationPoints = useMemo(
    () =>
      route.map((st, i) => {
        const x = 60 + (i / Math.max(route.length - 1, 1)) * (SCREEN_WIDTH - 120);
        const y = 140 + (i % 2 === 0 ? -20 : 20);
        return { ...st, xPos: x, yPos: y, index: i };
      }),
    [route, SCREEN_WIDTH]
  );

  // Compute train position from live progress (pure derivation, no refs during render)
  const trainPos = useMemo(() => {
    if (!live || route.length < 2) {
      if (route.length > 0) {
        const p = stationPoints[0];
        return { x: p.xPos, y: p.yPos, angle: 0 };
      }
      return { x: 0, y: 0, angle: 0 };
    }
    const csIdx = Math.min(live.currentStationIndex, route.length - 1);
    const nsIdx = Math.min(live.nextStationIndex, route.length - 1);
    const cs = stationPoints[csIdx];
    const ns = stationPoints[nsIdx];
    const p = Math.max(0, Math.min(1, live.progress));
    return {
      x: cs.xPos + (ns.xPos - cs.xPos) * p,
      y: cs.yPos + (ns.yPos - cs.yPos) * p,
      angle: Math.atan2(ns.yPos - cs.yPos, ns.xPos - cs.xPos) * (180 / Math.PI),
    };
  }, [live, route, stationPoints]);

  const pathD = route
    .map((_, i) => {
      const p = stationPoints[i];
      return i === 0 ? `M${p.xPos} ${p.yPos}` : `L${p.xPos} ${p.yPos}`;
    })
    .join(' ');

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH - 40} height={260} style={styles.svg}>
        <Defs>
          <SvgLinearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
            <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
          </SvgLinearGradient>
        </Defs>

        {/* Route track line */}
        <Path d={pathD} stroke="#334155" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Active route segment gradient (completed portion) */}
        {live && live.progress > 0 && (
          <Path
            d={pathD}
            stroke="url(#routeGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            style={{ strokeDasharray: '1000', strokeDashoffset: Math.max(0, 1000 - live.progress * 1000) }}
          />
        )}

        {/* Stations */}
        {stationPoints.map((st, i) => {
          const isCurrent = live && i === live.currentStationIndex;
          const isCompleted = live && i < live.currentStationIndex;
          const isCrossing = showCrossings && crossings.some((c) => c.train.route.some((s) => s.stationCode === st.code));

          return (
            <View key={i} style={[styles.stationWrapper, { left: st.xPos - 14, top: st.yPos - 24 }]}>
              <Circle cx={0} cy={0} r={isCurrent ? 9 : 6} fill={isCurrent ? '#F59E0B' : isCompleted ? '#10B981' : '#64748B'} />
              {isCurrent && (
                <Circle cx={0} cy={0} r={13} fill="none" stroke="#F59E0B" strokeWidth="2" />
              )}
              {isCrossing && (
                <Circle cx={0} cy={0} r={5} fill="#EF4444" />
              )}
            </View>
          );
        })}

        {/* Station labels */}
        {stationPoints.map((st, i) => {
          const isCurrent = live && i === live.currentStationIndex;
          const arrived = live && i <= live.currentStationIndex;
          return (
            <SvgText
              key={'label-' + i}
              x={st.xPos}
              y={st.yPos - (i % 2 === 0 ? -38 : 8)}
              textAnchor="middle"
              fontSize="10"
              fill={isCurrent ? '#F59E0B' : arrived ? '#10B981' : '#94A3B8'}
              fontWeight="700"
            >
              {st.stationCode}
            </SvgText>
          );
        })}

        {/* Moving train icon */}
        <g transform={`translate(${trainPos.x},${trainPos.y}) rotate(${trainPos.angle})`}>
          <Path
            d="M -14 0 L 14 0 L 0 -10 Z"
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <Circle cx={0} cy={0} r={3} fill="#FFFFFF" />
          <SvgText x={18} y={4} fontSize="9" fill="#FFFFFF" fontWeight="800">
            {train.trainNumber}
          </SvgText>
        </g>
      </Svg>

      <View style={styles.legend}>
        {stationPoints.map((st, i) => {
          const isCurrent = live && i === live.currentStationIndex;
          const arrived = live && i <= live.currentStationIndex;
          const isCrossing = showCrossings && crossings.some((c) => c.train.route.some((s) => s.stationCode === st.code));
          return (
            <View key={i} style={[styles.legendItem, isCurrent && styles.legendItemActive, isCrossing && styles.legendItemCrossing]}>
              <View style={[styles.legendDot, isCurrent && styles.legendDotActive, arrived && styles.legendDotArrived, isCrossing && styles.legendDotCrossing]} />
              <Text style={[styles.legendText, isCurrent && styles.legendTextActive, isCrossing && styles.legendTextCrossing]}>
                {st.stationCode}
                {isCrossing ? ' ✕' : ''}
                {isCurrent ? ' • LIVE' : arrived ? ' ✓' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },
  svg: {
    marginBottom: 8,
  },
  stationWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  legendItemCrossing: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  legendDotActive: {
    backgroundColor: '#F59E0B',
  },
  legendDotArrived: {
    backgroundColor: '#10B981',
  },
  legendDotCrossing: {
    backgroundColor: '#EF4444',
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  legendTextActive: {
    color: '#F59E0B',
  },
  legendTextCrossing: {
    color: '#EF4444',
  },
});

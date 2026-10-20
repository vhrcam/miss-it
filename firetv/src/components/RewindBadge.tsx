import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import type {LinkStatus} from '../playback/PlaybackReporter';
import {colors} from '../theme';

const LABELS: Record<LinkStatus, string> = {
  connecting: 'Connecting to Rewind',
  listening: 'Rewind is listening',
  offline: 'Rewind can’t connect',
};

// Shows whether the TV is reaching Rewind, so the link to Alexa is visible.
// While Rewind is listening, the halo around the dot pulses softly.
export function RewindBadge({status}: {status: LinkStatus}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'listening') {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  return (
    <View style={styles.badge}>
      <View style={styles.dotBox}>
        {status === 'listening' && (
          <Animated.View style={[styles.halo, {opacity: pulse}]} />
        )}
        <View style={[styles.dot, dotStyles[status]]} />
      </View>
      <Text style={[styles.label, status === 'connecting' && styles.quiet]}>
        {LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 28,
    borderWidth: 1,
    borderColor: 'rgba(245, 247, 250, 0.14)',
    borderRadius: 40,
    backgroundColor: 'rgba(11, 13, 18, 0.62)',
  },
  dotBox: {
    width: 28,
    height: 28,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentHalo,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  label: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '500',
  },
  quiet: {
    color: colors.meta,
  },
});

const dotStyles = StyleSheet.create({
  listening: {
    backgroundColor: colors.accent,
  },
  connecting: {
    borderWidth: 3,
    borderColor: colors.gray,
  },
  offline: {
    backgroundColor: colors.amber,
  },
});

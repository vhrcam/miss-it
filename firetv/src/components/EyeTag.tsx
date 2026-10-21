import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import type {LinkStatus} from '../playback/PlaybackReporter';
import {Eye} from './Eye';
import {colors} from '../theme';

const LABELS: Record<LinkStatus, string> = {
  connecting: 'Connecting to Miss It?',
  connected: 'Miss It? is on',
  offline: 'Miss It? can’t connect',
};

// The eye from the logo, so viewers can see Miss It? is following along.
// While it's connected the eye breathes softly. While it connects the eye is
// dimmed, and when it can't connect an amber dot sits on its corner.
export function EyeTag({status}: {status: LinkStatus}) {
  const breath = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    breath.setValue(1);
    if (status !== 'connected') {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, breath]);

  return (
    <View style={styles.tag} accessible accessibilityLabel={LABELS[status]}>
      <Animated.View
        style={status === 'connected' ? {opacity: breath} : styles.dim}>
        <Eye width={52} />
      </Animated.View>
      {status === 'offline' && <View style={styles.alert} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 12,
  },
  dim: {
    opacity: 0.4,
  },
  alert: {
    position: 'absolute',
    top: 6,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.amber,
  },
});

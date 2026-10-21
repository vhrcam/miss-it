import {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import type {Card} from '../api/answerCard';
import {colors} from '../theme';

// The answer Alexa just gave, under the eye tag. It fades in, so it
// doesn't flash onto the film.
export function AnswerCard({card}: {card: Card}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [card.id, opacity]);

  return (
    <Animated.View style={[styles.card, {opacity}]}>
      <Text style={styles.label}>{card.label}</Text>
      <Text style={styles.text}>{card.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 760,
    marginTop: 20,
    paddingTop: 34,
    paddingHorizontal: 40,
    paddingBottom: 38,
    borderWidth: 1,
    borderColor: 'rgba(245, 247, 250, 0.14)',
    borderRadius: 28,
    backgroundColor: 'rgba(11, 13, 18, 0.9)',
  },
  label: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '600',
  },
  text: {
    marginTop: 14,
    color: colors.white,
    fontSize: 32,
    lineHeight: 45,
  },
});

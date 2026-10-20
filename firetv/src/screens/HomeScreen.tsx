import {useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Logo} from '../components/Logo';
import {Triangle} from '../components/Triangle';
import {film} from '../config';
import {colors} from '../theme';

const ASKS = ['what did I miss?', 'who’s that?', 'why is she mad at him?'];

export function HomeScreen({onPlay}: {onPlay: () => void}) {
  const [playFocused, setPlayFocused] = useState(false);
  const playColor = playFocused ? colors.night : colors.white;

  return (
    <View style={styles.screen}>
      <Image source={require('../assets/home.jpg')} style={styles.backdrop} />

      <View style={styles.header}>
        <Logo />
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>BLENDER OPEN MOVIE</Text>
        <Text style={styles.title}>{film.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>2012</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>12 min</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>Sci-fi</Text>
          <Text style={styles.metaDot}>·</Text>
          <View style={styles.ccTag}>
            <Text style={styles.ccTagText}>CC</Text>
          </View>
        </View>
        <Text style={styles.synopsis}>
          Warriors and scientists gather in Amsterdam to restage a moment from
          the past, in a desperate attempt to save the world from destructive
          robots.
        </Text>
        <View style={styles.actions}>
          <View style={[styles.ring, playFocused && styles.ringFocused]}>
            <TouchableOpacity
              activeOpacity={0.85}
              hasTVPreferredFocus
              onFocus={() => setPlayFocused(true)}
              onBlur={() => setPlayFocused(false)}
              onPress={onPlay}
              style={[
                styles.button,
                styles.playButton,
                playFocused && styles.buttonFocused,
              ]}>
              <View style={styles.playIcon}>
                <Triangle
                  direction="right"
                  width={16}
                  height={19}
                  color={playColor}
                />
              </View>
              <Text style={[styles.buttonText, {color: playColor}]}>Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.askIntro}>
            Step away anytime. When you’re back, just ask:
          </Text>
          <View style={styles.chips}>
            {ASKS.map((ask, index) => (
              <View
                key={ask}
                style={[styles.chip, index === 0 && styles.chipFeatured]}>
                <Text style={styles.chipText}>“Alexa, {ask}”</Text>
              </View>
            ))}
          </View>
          <Text style={styles.promise}>
            Rewind only remembers what has already played, so it can’t spoil
            what’s next.
          </Text>
        </View>
        <Text style={styles.credit}>
          {film.title}
          {'\n'}(CC) Blender Foundation | mango.blender.org
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 64,
    left: 96,
    right: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    position: 'absolute',
    top: 268,
    left: 96,
    width: 880,
  },
  kicker: {
    color: colors.label,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 4,
  },
  title: {
    marginTop: 18,
    color: colors.white,
    fontSize: 116,
    lineHeight: 124,
    fontWeight: '700',
    letterSpacing: -2,
  },
  meta: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.meta,
    fontSize: 28,
  },
  metaDot: {
    marginHorizontal: 16,
    color: colors.gray,
    fontSize: 28,
  },
  ccTag: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(245, 247, 250, 0.6)',
    borderRadius: 6,
  },
  ccTagText: {
    color: colors.meta,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  synopsis: {
    marginTop: 30,
    maxWidth: 840,
    color: colors.body,
    fontSize: 30,
    lineHeight: 44,
  },
  actions: {
    marginTop: 50,
    marginLeft: -6,
    flexDirection: 'row',
  },
  ring: {
    padding: 6,
    marginRight: 12,
    borderRadius: 46,
  },
  ringFocused: {
    backgroundColor: colors.ring,
  },
  button: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 247, 250, 0.22)',
    borderRadius: 40,
    backgroundColor: 'rgba(245, 247, 250, 0.1)',
  },
  buttonFocused: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  playButton: {
    paddingLeft: 38,
    paddingRight: 48,
  },
  playIcon: {
    marginRight: 14,
    marginLeft: 3,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 96,
    right: 96,
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  askIntro: {
    color: colors.meta,
    fontSize: 26,
    fontWeight: '500',
  },
  chips: {
    marginTop: 18,
    flexDirection: 'row',
  },
  chip: {
    marginRight: 16,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderWidth: 2,
    borderColor: 'rgba(245, 247, 250, 0.18)',
    borderRadius: 40,
    backgroundColor: 'rgba(11, 13, 18, 0.55)',
  },
  chipFeatured: {
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '500',
  },
  promise: {
    marginTop: 18,
    color: colors.muted,
    fontSize: 22,
  },
  credit: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'right',
  },
});

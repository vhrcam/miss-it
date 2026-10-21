import {useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Logo} from '../components/Logo';
import {EyeTag} from '../components/EyeTag';
import {Triangle} from '../components/Triangle';
import {useLinkStatus} from '../api/useLinkStatus';
import {film} from '../config';
import {colors} from '../theme';

const ASKS = ['what did I miss?', 'who’s that?', 'why is she mad at him?'];

type Props = {
  captionsOn: boolean;
  onPlay: () => void;
  onToggleCaptions: () => void;
};

export function HomeScreen({captionsOn, onPlay, onToggleCaptions}: Props) {
  const linkStatus = useLinkStatus();

  return (
    <View style={styles.screen}>
      <Image source={require('../assets/home.jpg')} style={styles.backdrop} />

      <View style={styles.header}>
        <Logo />
        <EyeTag status={linkStatus} />
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
          <HomeButton kind="play" label="Play" onPress={onPlay} />
          <HomeButton
            kind="captions"
            label={captionsOn ? 'Captions on' : 'Captions off'}
            onPress={onToggleCaptions}
          />
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
            Miss It? only remembers what has already played, so it can’t spoil
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

type ButtonProps = {
  kind: 'play' | 'captions';
  label: string;
  onPress: () => void;
};

// A pill that turns white with a soft ring when the remote focuses it. Play
// takes focus first.
function HomeButton({kind, label, onPress}: ButtonProps) {
  const [focused, setFocused] = useState(false);
  const color = focused ? colors.night : colors.white;
  const play = kind === 'play';

  return (
    <View style={[styles.ring, focused && styles.ringFocused]}>
      <TouchableOpacity
        activeOpacity={1}
        hasTVPreferredFocus={play}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={onPress}
        style={[
          styles.button,
          play && styles.playButton,
          focused && styles.buttonFocused,
        ]}>
        {play ? (
          <View style={styles.playIcon}>
            <Triangle direction="right" width={16} height={19} color={color} />
          </View>
        ) : (
          <View style={[styles.buttonCc, {borderColor: color}]}>
            <Text style={[styles.buttonCcText, {color}]}>CC</Text>
          </View>
        )}
        <Text style={[styles.buttonText, play && styles.playText, {color}]}>
          {label}
        </Text>
      </TouchableOpacity>
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
    paddingLeft: 32,
    paddingRight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 247, 250, 0.22)',
    borderRadius: 40,
    backgroundColor: 'rgba(245, 247, 250, 0.1)',
  },
  playButton: {
    paddingLeft: 38,
    paddingRight: 48,
  },
  buttonFocused: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: '600',
  },
  playText: {
    fontWeight: '700',
  },
  playIcon: {
    marginLeft: 3,
    marginRight: 14,
  },
  buttonCc: {
    marginRight: 14,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderWidth: 2,
    borderRadius: 6,
  },
  buttonCcText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
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

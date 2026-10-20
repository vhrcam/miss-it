import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {
  KeplerCaptionsView,
  KeplerVideoSurfaceView,
} from '@amazon-devices/react-native-w3cmedia';
import {Fade} from '../components/Fade';
import {RewindBadge} from '../components/RewindBadge';
import {Triangle} from '../components/Triangle';
import {usePlayback} from '../player/usePlayback';
import {film} from '../config';
import {colors} from '../theme';

const SEEK_STEP_SEC = 10;
const CONTROLS_HIDE_MS = 4000;

function formatTime(sec: number) {
  const total = Math.max(0, Math.floor(sec));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

type Props = {
  captionsOn: boolean;
  onExit: () => void;
};

export function PlayerScreen({captionsOn, onExit}: Props) {
  const playback = usePlayback();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastInputAt, setLastInputAt] = useState(Date.now());
  const [positionSec, setPositionSec] = useState(0);

  useEffect(() => {
    setControlsVisible(true);
    if (playback.state !== 'playing') {
      return;
    }
    const timer = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
    return () => clearTimeout(timer);
  }, [playback.state, lastInputAt]);

  const {getPositionSec} = playback;
  useEffect(() => {
    if (!controlsVisible) {
      return;
    }
    setPositionSec(getPositionSec());
    const timer = setInterval(() => setPositionSec(getPositionSec()), 250);
    return () => clearInterval(timer);
  }, [controlsVisible, getPositionSec]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onExit();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onExit]);

  useTVEventHandler((event) => {
    if (event.eventKeyAction === 1) {
      return;
    }
    switch (event.eventType) {
      case 'select':
      case 'playpause':
        playback.toggle();
        break;
      case 'left':
      case 'rewind':
      case 'skip_backward':
        playback.seekBy(-SEEK_STEP_SEC);
        break;
      case 'right':
      case 'forward':
      case 'skip_forward':
        playback.seekBy(SEEK_STEP_SEC);
        break;
    }
    setLastInputAt(Date.now());
  });

  const progress =
    playback.durationSec > 0
      ? Math.min(positionSec / playback.durationSec, 1)
      : 0;
  const percent: `${number}%` = `${progress * 100}%`;

  return (
    <View style={styles.screen}>
      <KeplerVideoSurfaceView
        style={styles.video}
        scalingmode="fit"
        onSurfaceViewCreated={playback.onSurfaceViewCreated}
        onSurfaceViewDestroyed={playback.onSurfaceViewDestroyed}
      />
      {controlsVisible && (
        <>
          <Fade edge="top" height={280} edgeAlpha={0.8} midAlpha={0.4} />
          <Fade edge="bottom" height={480} edgeAlpha={0.94} midAlpha={0.62} />
        </>
      )}
      {/* The caption view only takes its frame when it's created, so it's
          made again to move the captions above the controls and back. */}
      <KeplerCaptionsView
        key={controlsVisible ? 'raised' : 'low'}
        style={[styles.captions, controlsVisible && styles.captionsRaised]}
        show={captionsOn}
        onCaptionViewCreated={playback.onCaptionViewCreated}
        onCaptionViewDestroyed={playback.onCaptionViewDestroyed}
      />

      {controlsVisible && (
        <>
          <View style={styles.heading}>
            <Text style={styles.title}>{film.title}</Text>
            <Text style={styles.byline}>Blender Foundation · 2012</Text>
          </View>
          <View style={styles.corner}>
            <RewindBadge status={playback.link} />
          </View>
        </>
      )}

      {playback.buffering && !playback.failure && (
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          color="#FFFFFF"
        />
      )}

      {playback.failure && (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>The film didn’t load</Text>
          <Text style={styles.messageBody}>
            Check the internet connection, then press Back and try again.
          </Text>
          <Text style={styles.messageDetail}>{playback.failure}</Text>
        </View>
      )}

      {controlsVisible && (
        <View style={styles.controls}>
          <View style={styles.toggleRing}>
            <View style={styles.toggle}>
              {playback.state === 'playing' ? (
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              ) : (
                <View style={styles.playIcon}>
                  <Triangle
                    direction="right"
                    width={24}
                    height={28}
                    color={colors.night}
                  />
                </View>
              )}
            </View>
          </View>
          <View style={styles.timeline}>
            <View style={styles.track}>
              <View style={[styles.fill, {width: percent}]} />
              <View style={[styles.knob, {left: percent}]} />
            </View>
            <View style={styles.times}>
              <Text style={styles.time}>{formatTime(positionSec)}</Text>
              <View style={styles.hints}>
                <View style={styles.hint}>
                  <Triangle
                    direction="left"
                    width={11}
                    height={14}
                    color={colors.muted}
                  />
                  <Text style={[styles.hintText, styles.hintAfterIcon]}>
                    {SEEK_STEP_SEC} sec back
                  </Text>
                </View>
                <View style={[styles.hint, styles.hintAhead]}>
                  <Text style={[styles.hintText, styles.hintBeforeIcon]}>
                    {SEEK_STEP_SEC} sec ahead
                  </Text>
                  <Triangle
                    direction="right"
                    width={11}
                    height={14}
                    color={colors.muted}
                  />
                </View>
              </View>
              <Text style={styles.time}>
                {formatTime(playback.durationSec)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  captions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  },
  captionsRaised: {
    bottom: 220,
  },
  heading: {
    position: 'absolute',
    top: 64,
    left: 96,
    zIndex: 3,
  },
  title: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  byline: {
    marginTop: 8,
    color: colors.label,
    fontSize: 24,
  },
  corner: {
    position: 'absolute',
    top: 64,
    right: 96,
    zIndex: 3,
    alignItems: 'flex-end',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    zIndex: 3,
  },
  message: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  messageTitle: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '600',
  },
  messageBody: {
    color: colors.body,
    fontSize: 28,
    marginTop: 16,
  },
  messageDetail: {
    color: colors.muted,
    fontSize: 22,
    marginTop: 24,
  },
  controls: {
    position: 'absolute',
    left: 90,
    right: 96,
    bottom: 66,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ring,
  },
  toggle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pauseIcon: {
    flexDirection: 'row',
  },
  pauseBar: {
    width: 6,
    height: 22,
    marginHorizontal: 3,
    borderRadius: 2,
    backgroundColor: colors.night,
  },
  playIcon: {
    marginLeft: 6,
  },
  timeline: {
    flex: 1,
    marginLeft: 34,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(245, 247, 250, 0.25)',
  },
  fill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  knob: {
    position: 'absolute',
    top: -7,
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  times: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.meta,
    fontSize: 26,
  },
  hints: {
    flexDirection: 'row',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintAhead: {
    marginLeft: 36,
  },
  hintText: {
    color: colors.muted,
    fontSize: 22,
  },
  hintAfterIcon: {
    marginLeft: 10,
  },
  hintBeforeIcon: {
    marginRight: 10,
  },
});

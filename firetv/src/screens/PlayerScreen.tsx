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
import {RewindBadge} from '../components/RewindBadge';
import {usePlayback} from '../player/usePlayback';
import {film} from '../config';

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

  return (
    <View style={styles.screen}>
      <KeplerVideoSurfaceView
        style={styles.video}
        scalingmode="fit"
        onSurfaceViewCreated={playback.onSurfaceViewCreated}
        onSurfaceViewDestroyed={playback.onSurfaceViewDestroyed}
      />
      <KeplerCaptionsView
        style={styles.captions}
        show={captionsOn}
        onCaptionViewCreated={playback.onCaptionViewCreated}
        onCaptionViewDestroyed={playback.onCaptionViewDestroyed}
      />

      <View style={styles.corner}>
        <RewindBadge status={playback.link} />
      </View>

      {playback.buffering && !playback.failure && (
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          color="#FFFFFF"
        />
      )}

      {playback.failure && (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>The film didn't load</Text>
          <Text style={styles.messageBody}>
            Check that the media server is running, then press Back and try
            again.
          </Text>
          <Text style={styles.messageDetail}>{playback.failure}</Text>
        </View>
      )}

      {controlsVisible && (
        <View style={styles.controls}>
          <Text style={styles.title}>{film.title}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, {width: `${progress * 100}%`}]} />
          </View>
          <View style={styles.times}>
            <Text style={styles.time}>
              {playback.state === 'playing' ? 'Playing' : 'Paused'} ·{' '}
              {formatTime(positionSec)}
            </Text>
            <Text style={styles.time}>{formatTime(playback.durationSec)}</Text>
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
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
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
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '600',
  },
  messageBody: {
    color: '#C9CDD4',
    fontSize: 28,
    marginTop: 16,
  },
  messageDetail: {
    color: '#8A8F98',
    fontSize: 22,
    marginTop: 24,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    paddingHorizontal: 96,
    paddingTop: 48,
    paddingBottom: 64,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
    marginBottom: 24,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    backgroundColor: '#3DD6F5',
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  time: {
    color: '#C9CDD4',
    fontSize: 26,
  },
});

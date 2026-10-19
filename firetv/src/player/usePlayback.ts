import {useCallback, useEffect, useRef, useState} from 'react';
import {VideoPlayer, VTTCue} from '@amazon-devices/react-native-w3cmedia';
import {Cue, parseWebVTT} from '../captions/webvtt';
import {CueTracker} from '../playback/CueTracker';
import {
  LinkStatus,
  PlaybackReporter,
  PlaybackState,
  Snapshot,
} from '../playback/PlaybackReporter';
import {film, rewind} from '../config';

const POLL_MS = 500;
const TICK_MS = 5000;
const SEEK_TIMEOUT_MS = 3000;
const MAX_ATTEMPTS = film.sources.length * 2;
const RETRY_DELAY_MS = 2500;

const CUES = parseWebVTT(film.captions);

function showCaptions(player: VideoPlayer, cues: Cue[]) {
  const track = player.addTextTrack('subtitles', 'English', 'en');
  if (!track) {
    return;
  }
  for (const cue of cues) {
    track.addCue(new VTTCue(cue.startSec, cue.endSec, cue.text));
  }
  track.mode = 'showing';
}

// Owns the video player for one viewing of the film: playback, captions,
// and the updates that keep Rewind's memory in step with the screen.
export function usePlayback() {
  const playerRef = useRef<VideoPlayer | null>(null);
  const surfaceRef = useRef<string | null>(null);
  const captionViewRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const trackerRef = useRef(new CueTracker(CUES));
  const seekRef = useRef<{targetSec: number; since: number} | null>(null);
  const snapshotRef = useRef<Snapshot>({
    positionSec: 0,
    durationSec: 0,
    state: 'paused',
  });
  const reporterRef = useRef<PlaybackReporter | null>(null);

  const [state, setState] = useState<PlaybackState>('paused');
  const [buffering, setBuffering] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [link, setLink] = useState<LinkStatus>('connecting');

  if (!reporterRef.current) {
    reporterRef.current = new PlaybackReporter({
      ...rewind,
      contentId: film.contentId,
      title: film.title,
      snapshot: () => snapshotRef.current,
      takeCues: () => trackerRef.current.take(),
      onStatus: setLink,
    });
  }

  const capture = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const seek = seekRef.current;
    if (seek && Date.now() - seek.since > SEEK_TIMEOUT_MS) {
      seekRef.current = null;
    }
    if (!seekRef.current) {
      trackerRef.current.advance(player.currentTime);
    }
    snapshotRef.current = {
      positionSec: player.currentTime,
      durationSec: player.duration || 0,
      state: player.ended ? 'ended' : player.paused ? 'paused' : 'playing',
    };
  }, []);

  const start = useCallback(() => {
    const player = playerRef.current;
    if (player && surfaceRef.current && !startedRef.current) {
      startedRef.current = true;
      player.setSurfaceHandle(surfaceRef.current);
      trackerRef.current.seek(0);
      player.play();
    }
  }, []);

  useEffect(() => {
    const player = new VideoPlayer();
    const reporter = reporterRef.current!;
    let active = true;

    const report = (event: 'play' | 'pause' | 'seek' | 'ended') => {
      capture();
      setState(snapshotRef.current.state);
      reporter.report(event);
    };
    const listeners: Record<string, () => void> = {
      play: () => report('play'),
      pause: () => report('pause'),
      ended: () => report('ended'),
      seeked: () => {
        seekRef.current = null;
        trackerRef.current.seek(player.currentTime);
        report('seek');
      },
      playing: () => {
        attempts = 1;
        setBuffering(false);
      },
      canplay: () => setBuffering(false),
      waiting: () => setBuffering(true),
      loadedmetadata: () => setDurationSec(player.duration || 0),
      durationchange: () => setDurationSec(player.duration || 0),
      error: () => {
        if (attempts >= MAX_ATTEMPTS) {
          setFailure(`Media error ${player.error?.code ?? ''}`.trim());
          return;
        }
        // Try the next mirror after a pause. Right after the device boots,
        // its network can take a few seconds to come up.
        const resumeSec = player.currentTime;
        const next = film.sources[attempts % film.sources.length];
        attempts += 1;
        retryTimer = setTimeout(() => {
          player.src = next;
          if (resumeSec > 0) {
            player.currentTime = resumeSec;
          }
          player.play();
        }, RETRY_DELAY_MS);
      },
    };
    let attempts = 1;
    let retryTimer = 0;

    const ready = player
      .initialize()
      .then(() => {
        if (!active) {
          return;
        }
        for (const [name, listener] of Object.entries(listeners)) {
          player.addEventListener(name, listener);
        }
        player.autoplay = false;
        player.src = film.sources[0];
        showCaptions(player, CUES);
        if (captionViewRef.current) {
          player.setCaptionViewHandle(captionViewRef.current);
        }
        playerRef.current = player;
        start();
      })
      .catch((error) => setFailure(String(error)));

    return () => {
      active = false;
      clearTimeout(retryTimer);
      ready
        .then(() => {
          for (const [name, listener] of Object.entries(listeners)) {
            player.removeEventListener(name, listener);
          }
          if (playerRef.current === player) {
            capture();
            snapshotRef.current = {...snapshotRef.current, state: 'paused'};
            reporter.report('pause');
            playerRef.current = null;
          }
          player.pause();
          return player.deinitialize();
        })
        .catch(() => {});
    };
  }, [capture, start]);

  useEffect(() => {
    if (state !== 'playing') {
      return;
    }
    const poll = setInterval(capture, POLL_MS);
    const tick = setInterval(
      () => reporterRef.current!.report('tick'),
      TICK_MS,
    );
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [state, capture]);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (player.ended) {
      player.currentTime = 0;
      player.play();
    } else if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }, []);

  const seekBy = useCallback(
    (deltaSec: number) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      capture();
      const fromSec = seekRef.current?.targetSec ?? player.currentTime;
      const lastSec = Math.max(0, (player.duration || 0) - 1);
      const targetSec = Math.min(Math.max(fromSec + deltaSec, 0), lastSec);
      seekRef.current = {targetSec, since: Date.now()};
      player.currentTime = targetSec;
    },
    [capture],
  );

  const getPositionSec = useCallback(
    () => seekRef.current?.targetSec ?? playerRef.current?.currentTime ?? 0,
    [],
  );

  const onSurfaceViewCreated = useCallback(
    (handle: string) => {
      surfaceRef.current = handle;
      if (startedRef.current) {
        playerRef.current?.setSurfaceHandle(handle);
      } else {
        start();
      }
    },
    [start],
  );

  const onSurfaceViewDestroyed = useCallback((handle: string) => {
    surfaceRef.current = null;
    playerRef.current?.clearSurfaceHandle(handle);
  }, []);

  const onCaptionViewCreated = useCallback((handle: string) => {
    captionViewRef.current = handle;
    playerRef.current?.setCaptionViewHandle(handle);
  }, []);

  const onCaptionViewDestroyed = useCallback((handle: string) => {
    captionViewRef.current = null;
    playerRef.current?.clearCaptionViewHandle(handle);
  }, []);

  return {
    state,
    buffering,
    failure,
    durationSec,
    link,
    toggle,
    seekBy,
    getPositionSec,
    onSurfaceViewCreated,
    onSurfaceViewDestroyed,
    onCaptionViewCreated,
    onCaptionViewDestroyed,
  };
}

import {useState} from 'react';
import {HomeScreen} from './screens/HomeScreen';
import {PlayerScreen} from './screens/PlayerScreen';

export const App = () => {
  const [watching, setWatching] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);

  if (watching) {
    return (
      <PlayerScreen captionsOn={captionsOn} onExit={() => setWatching(false)} />
    );
  }

  return (
    <HomeScreen
      captionsOn={captionsOn}
      onPlay={() => setWatching(true)}
      onToggleCaptions={() => setCaptionsOn((on) => !on)}
    />
  );
};

import {useState} from 'react';
import {HomeScreen} from './screens/HomeScreen';
import {PlayerScreen} from './screens/PlayerScreen';

export const App = () => {
  const [watching, setWatching] = useState(false);

  if (watching) {
    return <PlayerScreen onExit={() => setWatching(false)} />;
  }

  return <HomeScreen onPlay={() => setWatching(true)} />;
};

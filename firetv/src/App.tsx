import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {PlayerScreen} from './screens/PlayerScreen';

export const App = () => {
  const [watching, setWatching] = useState(true);

  if (watching) {
    return <PlayerScreen onExit={() => setWatching(false)} />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Rewind</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D12',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 64,
  },
});

import {StyleSheet, Text, View} from 'react-native';

export const App = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Rewind</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D12',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 64,
  },
});

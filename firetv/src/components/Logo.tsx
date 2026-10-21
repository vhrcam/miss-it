import {StyleSheet, Text, View} from 'react-native';
import {Eye} from './Eye';
import {colors} from '../theme';

// The eye, then the name.
export function Logo() {
  return (
    <View style={styles.logo}>
      <View style={styles.mark}>
        <Eye width={64} />
      </View>
      <Text style={styles.name}>Miss It?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    marginRight: 16,
  },
  name: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

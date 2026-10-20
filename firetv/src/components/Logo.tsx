import {StyleSheet, Text, View} from 'react-native';
import {Triangle} from './Triangle';
import {colors} from '../theme';

// Two rewind arrows in a ring, then the name.
export function Logo() {
  return (
    <View style={styles.logo}>
      <View style={styles.mark}>
        <View style={styles.ring} />
        <View style={[styles.arrow, styles.arrowBack]}>
          <Triangle
            direction="left"
            width={12}
            height={17}
            color={colors.accent}
          />
        </View>
        <View style={[styles.arrow, styles.arrowFront]}>
          <Triangle
            direction="left"
            width={12}
            height={17}
            color={colors.white}
          />
        </View>
      </View>
      <Text style={styles.name}>Rewind</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    width: 52,
    height: 52,
    marginRight: 16,
  },
  ring: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    width: 49,
    height: 49,
    borderRadius: 24.5,
    borderWidth: 3,
    borderColor: colors.white,
  },
  arrow: {
    position: 'absolute',
    top: 17.5,
  },
  arrowBack: {
    left: 13,
  },
  arrowFront: {
    left: 26,
  },
  name: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

import {Image, StyleSheet} from 'react-native';

// The eye from the Miss It? logo. Vega has no SVG, so it's a PNG drawn by
// scripts/make-logo.mjs in the repo root, kept at the logo's proportions.
export function Eye({width}: {width: number}) {
  return (
    <Image
      source={require('../assets/eye.png')}
      style={[styles.eye, {width, height: (width * 518) / 812}]}
    />
  );
}

const styles = StyleSheet.create({
  eye: {
    resizeMode: 'contain',
  },
});

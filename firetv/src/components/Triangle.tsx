import {StyleSheet, View} from 'react-native';

type Props = {
  direction: 'left' | 'right';
  width: number;
  height: number;
  color: string;
};

// Vega has no SVG, so icons are drawn with views. A triangle is a zero-size
// view with one colored border and two transparent ones.
export function Triangle({direction, width, height, color}: Props) {
  const point =
    direction === 'left'
      ? {borderRightWidth: width, borderRightColor: color}
      : {borderLeftWidth: width, borderLeftColor: color};
  return (
    <View
      style={[
        styles.triangle,
        {borderTopWidth: height / 2, borderBottomWidth: height / 2},
        point,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

import {StyleSheet, View} from 'react-native';

type Props = {
  edge: 'top' | 'bottom';
  height: number;
  edgeAlpha: number;
  midAlpha: number;
};

const STRIP = 8;

// Darkens the video behind the controls, from edgeAlpha at the screen's edge
// through midAlpha halfway to clear. Vega doesn't draw images over the video,
// so the gradient is a stack of thin see-through strips.
export function Fade({edge, height, edgeAlpha, midAlpha}: Props) {
  const count = Math.ceil(height / STRIP);
  const strips = Array.from({length: count}, (_, index) => {
    const fromEdge = (index + 0.5) / count;
    const alpha =
      fromEdge < 0.5
        ? edgeAlpha + (midAlpha - edgeAlpha) * fromEdge * 2
        : midAlpha * (1 - fromEdge) * 2;
    return `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
  });
  if (edge === 'bottom') {
    strips.reverse();
  }

  return (
    <View
      style={[
        styles.fade,
        edge === 'top' ? styles.top : styles.bottom,
        {height},
      ]}>
      {strips.map((color, index) => (
        <View key={index} style={[styles.strip, {backgroundColor: color}]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  strip: {
    height: STRIP,
  },
});

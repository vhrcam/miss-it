import {useEffect, useRef, type ReactNode} from 'react';
import {Animated, type StyleProp, type ViewStyle} from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// Fades its children in when it appears, over the same 250 ms as the answer
// card, so the eye tag doesn't pop onto the film.
export function FadeIn({style, children}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return <Animated.View style={[style, {opacity}]}>{children}</Animated.View>;
}

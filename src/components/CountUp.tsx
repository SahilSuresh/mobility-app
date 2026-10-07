import { useEffect, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { T } from './T';

/** A number that counts up from 0 to `value`, `delay` ms after the screen opens, easing out as it lands. */
export function CountUp({ value, delay = 0, duration = 700, style }: { value: number; delay?: number; duration?: number; style?: StyleProp<TextStyle> }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    let frame = 0;
    const timer = setTimeout(() => {
      const start = Date.now();
      const step = () => {
        const t = Math.min(1, (Date.now() - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, delay, duration, reduceMotion]);

  // Screen readers hear the final number, not the count.
  return (
    <T style={style} accessibilityLabel={String(value)}>
      {reduceMotion ? value : shown}
    </T>
  );
}

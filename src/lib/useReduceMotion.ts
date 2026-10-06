import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True while the system "Reduce Motion" setting is on, so decorative animation can stay still. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => {
        if (live) setReduce(on);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

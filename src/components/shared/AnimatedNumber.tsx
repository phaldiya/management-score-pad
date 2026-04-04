import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export default function AnimatedNumber({ value, duration = 800 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef<number | undefined>(undefined);
  const rafRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;

    if (prev === undefined || prev === value) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = prev;
    const delta = value - from;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(from + delta * easeOut(progress)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span>{display}</span>;
}

import { useEffect, useState, useRef } from "react";

export const useCountUp = (end: number, duration = 1200, decimals = 0) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration]);

  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value);
};

export const formatCurrency = (n: number) => {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const formatNumber = (n: number) => {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

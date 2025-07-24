'use client';
import { useEffect, useState } from 'react';

interface SlidingNumberProps {
  value: number;
  padStart?: boolean;
}

export function SlidingNumber({ value, padStart = false }: SlidingNumberProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <span className="inline-block w-[1ch] text-center tabular-nums font-light">
        0
      </span>
    );
  }

  const displayValue = padStart ? value.toString().padStart(2, '0') : value.toString();
  
  return (
    <span className="inline-block w-[1ch] text-center tabular-nums font-light transition-all duration-300">
      {displayValue}
    </span>
  );
}
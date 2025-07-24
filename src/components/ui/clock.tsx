'use client';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useEffect, useState } from 'react';

export function Clock() {
  const [mounted, setMounted] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with current time
    const now = new Date();
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    setSeconds(now.getSeconds());

    // Update time every second
    const interval = setInterval(() => {
      const now = new Date();
      setHours(now.getHours());
      setMinutes(now.getMinutes());
      setSeconds(now.getSeconds());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className='flex items-center justify-center gap-0.5 text-5xl font-light tracking-tight'>
        <span className="tabular-nums">00</span>
        <span className='text-gray-500 dark:text-gray-400'>:</span>
        <span className="tabular-nums">00</span>
        <span className='text-gray-500 dark:text-gray-400'>:</span>
        <span className="tabular-nums">00</span>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center gap-0.5 text-5xl font-light tracking-tight'>
      <SlidingNumber value={hours} padStart={true} />
      <span className='text-gray-500 dark:text-gray-400'>:</span>
      <SlidingNumber value={minutes} padStart={true} />
      <span className='text-gray-500 dark:text-gray-400'>:</span>
      <SlidingNumber value={seconds} padStart={true} />
    </div>
  );
}
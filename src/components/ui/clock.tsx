'use client';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useEffect, useState } from 'react';

export function Clock() {
  const [hours, setHours] = useState(new Date().getHours());
  const [minutes, setMinutes] = useState(new Date().getMinutes());
  const [seconds, setSeconds] = useState(new Date().getSeconds());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHours(now.getHours());
      setMinutes(now.getMinutes());
      setSeconds(now.getSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
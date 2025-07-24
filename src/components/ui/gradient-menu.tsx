import React from 'react';
import { IoHomeOutline, IoStatsChartOutline, IoTimeOutline, IoPersonOutline, IoSettingsOutline } from 'react-icons/io5';

interface GradientMenuProps {
  onItemClick?: (index: number, title: string) => void;
}

const menuItems = [
  { title: 'ホーム', icon: <IoHomeOutline />, gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
  { title: '統計', icon: <IoStatsChartOutline />, gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
  { title: '履歴', icon: <IoTimeOutline />, gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
  { title: 'プロフィール', icon: <IoPersonOutline />, gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
  { title: '設定', icon: <IoSettingsOutline />, gradientFrom: '#ffa9c6', gradientTo: '#f434e2' }
];

export default function GradientMenu({ onItemClick }: GradientMenuProps) {
  return (
    <div className="flex justify-center items-center">
      <ul className="flex gap-4">
        {menuItems.map(({ title, icon, gradientFrom, gradientTo }, idx) => (
          <li
            key={idx}
            style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}
            className="relative w-[50px] h-[50px] bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[140px] hover:shadow-none group cursor-pointer"
            onClick={() => onItemClick?.(idx, title)}
          >
            {/* Gradient background on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>
            {/* Blur glow */}
            <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-50"></span>

            {/* Icon */}
            <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0">
              <span className="text-xl text-gray-500">{icon}</span>
            </span>

            {/* Title */}
            <span className="absolute text-white uppercase tracking-wide text-xs transition-all duration-500 scale-0 group-hover:scale-100 delay-150">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
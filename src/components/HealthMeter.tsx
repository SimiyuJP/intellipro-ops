import { motion } from 'framer-motion';
import { HealthStatus } from '@/types/project';

interface HealthMeterProps {
  score: number;
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const statusColors = {
  green: 'text-health-green',
  yellow: 'text-health-yellow',
  red: 'text-health-red',
};

const statusBg = {
  green: 'stroke-health-green',
  yellow: 'stroke-health-yellow',
  red: 'stroke-health-red',
};

const sizes = {
  sm: { width: 60, strokeWidth: 4, fontSize: 'text-sm' },
  md: { width: 100, strokeWidth: 6, fontSize: 'text-xl' },
  lg: { width: 160, strokeWidth: 8, fontSize: 'text-3xl' },
};

export function HealthMeter({ score, status, size = 'md', label }: HealthMeterProps) {
  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width, height: width }}>
        <svg width={width} height={width} className="-rotate-90">
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            className={statusBg[status]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display font-bold ${fontSize} ${statusColors[status]}`}>
            {score}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}

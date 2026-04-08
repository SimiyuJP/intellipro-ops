import { HealthStatus } from '@/types/project';

interface HealthBadgeProps {
  status: HealthStatus;
  label?: string;
}

export function HealthBadge({ status, label }: HealthBadgeProps) {
  const className = status === 'green'
    ? 'health-badge-green'
    : status === 'yellow'
    ? 'health-badge-yellow'
    : 'health-badge-red';

  return (
    <span className={className}>
      {label || status.toUpperCase()}
    </span>
  );
}

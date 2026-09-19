import { STATUS_CONFIG } from '../constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isLarge = size === 'lg';

  return (
    <span
      className={`badge ${config.badgeClass} ${
        isLarge ? 'px-3 py-1.5 text-xs font-medium' : 'px-2.5 py-0.5 text-xs'
      }`}
      title={config.description}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotClass}`} />
      <span>{isLarge ? config.label : config.shortLabel || config.label}</span>
    </span>
  );
}

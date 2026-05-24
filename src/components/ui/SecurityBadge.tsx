import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import type { SecurityLayer } from '../../types';
import { cn } from '../../utils/cn';
import { formatTimeAgo } from '../../utils/cn';

interface SecurityBadgeProps {
  layer: SecurityLayer;
  compact?: boolean;
}

const SecurityBadge: React.FC<SecurityBadgeProps> = ({ layer, compact = false }) => {
  const statusConfig = {
    active: { color: 'text-titan-success', bg: 'bg-titan-success/10', border: 'border-titan-success/20', label: 'Active', Icon: ShieldCheck },
    standby: { color: 'text-titan-subtext', bg: 'bg-titan-muted/20', border: 'border-titan-border', label: 'Standby', Icon: Shield },
    alert: { color: 'text-titan-danger', bg: 'bg-titan-danger/10', border: 'border-titan-danger/20', label: 'Alert', Icon: ShieldAlert },
  };

  const cfg = statusConfig[layer.status];
  const Icon = cfg.Icon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', cfg.bg, cfg.border)}>
        <Icon size={14} className={cfg.color} />
        <span className={cn('text-xs font-medium', cfg.color)}>{layer.name}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border transition-all hover:border-titan-border/80',
      cfg.bg, cfg.border
    )}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', 'bg-titan-card')}>
        <span className="text-lg">{layer.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-titan-text">{layer.name}</span>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.color === 'text-titan-success' ? 'bg-titan-success' : cfg.color === 'text-titan-danger' ? 'bg-titan-danger' : 'bg-titan-subtext')} />
            <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
          </div>
        </div>
        <p className="text-xs text-titan-subtext mt-0.5 leading-relaxed">{layer.shortDesc}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-titan-subtext/60">Last check: {formatTimeAgo(layer.lastCheck)}</span>
          <span className="text-xs text-titan-subtext/60">{layer.eventsCount} events</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityBadge;

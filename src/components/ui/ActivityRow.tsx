import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle2, Clock, ExternalLink, XCircle, ShieldCheck } from 'lucide-react';
import type { Activity } from '../../types';
import { formatUSD, formatTimeAgo, formatHash } from '../../utils/cn';
import { cn } from '../../utils/cn';

interface ActivityRowProps {
  activity: Activity;
  onClick?: () => void;
}

const typeConfig = {
  send: { icon: ArrowUpRight, label: 'Sent', color: 'text-titan-danger', bg: 'bg-titan-danger/10' },
  receive: { icon: ArrowDownLeft, label: 'Received', color: 'text-titan-success', bg: 'bg-titan-success/10' },
  swap: { icon: RefreshCw, label: 'Swapped', color: 'text-titan-accent', bg: 'bg-titan-accent/10' },
  approve: { icon: ShieldCheck, label: 'Approved', color: 'text-titan-warning', bg: 'bg-titan-warning/10' },
  stake: { icon: ArrowUpRight, label: 'Staked', color: 'text-titan-gold', bg: 'bg-titan-gold/10' },
};

const statusIcon = {
  confirmed: <CheckCircle2 size={12} className="text-titan-success" />,
  pending: <Clock size={12} className="text-titan-warning" />,
  failed: <XCircle size={12} className="text-titan-danger" />,
};

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, onClick }) => {
  const cfg = typeConfig[activity.type];
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-titan-muted/20 transition-all duration-150',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cfg.bg)}>
          <Icon size={16} className={cfg.color} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-titan-text">{cfg.label}</span>
            <span className="text-xs font-mono text-titan-subtext">{activity.symbol}</span>
            {statusIcon[activity.status]}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-titan-subtext font-mono">{formatHash(activity.hash)}</span>
            {activity.explorerUrl && (
              <>
                <span className="text-xs text-titan-subtext/50">·</span>
                <a
                  href={activity.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-titan-accent hover:text-titan-accent/80"
                  onClick={(event) => event.stopPropagation()}
                >
                  Explorer
                  <ExternalLink size={11} />
                </a>
              </>
            )}
            <span className="text-xs text-titan-subtext/50">·</span>
            <span className="text-xs text-titan-subtext">{formatTimeAgo(activity.timestamp)}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={cn(
          'text-sm font-semibold',
          activity.type === 'send' ? 'text-titan-danger' : 'text-titan-text'
        )}>
          {activity.type === 'send' ? '-' : '+'}{activity.amountUSD > 0 ? formatUSD(activity.amountUSD) : activity.amount}
        </div>
        <div className="text-xs text-titan-subtext">{activity.network}</div>
      </div>
    </div>
  );
};

export default ActivityRow;

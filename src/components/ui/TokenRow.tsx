import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Token } from '../../types';
import { formatUSD } from '../../utils/cn';
import { cn } from '../../utils/cn';
import Badge from './Badge';

interface TokenRowProps {
  token: Token;
  onClick?: () => void;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, onClick }) => {
  const isPositive = token.change24h >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-titan-muted/20 transition-all duration-150',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-3">
        {token.logoUrl ? (
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="h-10 w-10 rounded-full border border-titan-border/60 bg-titan-bg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-titan-muted/40 flex items-center justify-center text-lg font-mono select-none">
            {token.icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-titan-text">{token.symbol}</div>
            <Badge
              variant={token.source === 'custom' ? 'accent' : token.source === 'detected' ? 'success' : 'neutral'}
              size="sm"
            >
              {token.source === 'custom' ? 'Custom' : token.source === 'detected' ? 'Auto detected' : 'Default'}
            </Badge>
          </div>
          <div className="text-xs text-titan-subtext">{token.name}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-titan-text">{formatUSD(token.balanceUSD)}</div>
        <div className="text-xs text-titan-subtext">{token.balance} {token.symbol}</div>
        <div className={cn(
          'text-xs flex items-center justify-end gap-0.5',
          isPositive ? 'text-titan-success' : 'text-titan-danger'
        )}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default TokenRow;

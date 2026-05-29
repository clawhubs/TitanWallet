import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Token } from '../../types';
import { formatUSD } from '../../utils/cn';
import { cn } from '../../utils/cn';
import Badge from './Badge';

interface TokenRowProps {
  token: Token;
  onClick?: () => void;
  variant?: 'default' | 'wallet-compact';
}

function formatTokenAmount(rawAmount: string) {
  const normalized = rawAmount.replace(/,/g, '');

  if (!/^-?\d*\.?\d+$/.test(normalized)) {
    return rawAmount;
  }

  const [whole, decimals = ''] = normalized.split('.');
  const trimmedDecimals = decimals.replace(/0+$/, '');

  if (!trimmedDecimals) {
    return whole || '0';
  }

  return `${whole || '0'}.${trimmedDecimals}`;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, onClick, variant = 'default' }) => {
  const isPositive = token.change24h >= 0;
  const sourceLabel =
    token.source === 'custom' ? 'Custom' : token.source === 'detected' ? 'Auto detected' : 'Default';
  const shouldShowSourceBadge =
    token.source === 'custom' || (token.source === 'detected' && Boolean(token.contractAddress));

  if (variant === 'wallet-compact') {
    return (
      <div
        onClick={onClick}
        data-token-id={token.id}
        data-token-network={token.network}
        data-token-symbol={token.symbol}
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3.5 transition-all duration-150',
          onClick && 'cursor-pointer',
        )}
      >
        <div className="min-w-0 flex items-center gap-3">
          {token.logoUrl ? (
            <img
              src={token.logoUrl}
              alt={token.symbol}
              className="h-11 w-11 rounded-full border border-titan-border/60 bg-titan-bg object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-titan-muted/40 text-lg font-mono select-none">
              {token.icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-[15px] font-semibold text-white">{token.name}</div>
              {shouldShowSourceBadge ? (
                <Badge
                  variant={token.source === 'custom' ? 'accent' : 'success'}
                  size="sm"
                >
                  {sourceLabel}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-titan-subtext">
              <span className={cn('font-semibold', isPositive ? 'text-[#A7F352]' : 'text-[#FF6B7A]')}>
                {isPositive ? '+' : ''}
                {token.change24h.toFixed(2)}%
              </span>
              <span className="truncate">{token.symbol} • {token.network}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[15px] font-semibold text-white">{formatUSD(token.balanceUSD)}</div>
          <div className="mt-1 text-xs font-medium text-titan-subtext">
            {formatTokenAmount(token.balance)} {token.symbol}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      data-token-id={token.id}
      data-token-network={token.network}
      data-token-symbol={token.symbol}
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
            {token.source === 'default' || shouldShowSourceBadge ? (
              <Badge
                variant={token.source === 'custom' ? 'accent' : token.source === 'detected' ? 'success' : 'neutral'}
                size="sm"
              >
                {sourceLabel}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-titan-subtext">{token.name}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-titan-text">{formatUSD(token.balanceUSD)}</div>
        <div className="text-xs text-titan-subtext">{formatTokenAmount(token.balance)} {token.symbol}</div>
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

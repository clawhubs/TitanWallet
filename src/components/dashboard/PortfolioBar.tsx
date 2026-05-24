import React, { useState } from 'react';

interface TokenShare {
  symbol: string;
  percentage: number;
  color: string;
}

interface PortfolioBarProps {
  tokens: TokenShare[];
}

const PortfolioBar: React.FC<PortfolioBarProps> = ({ tokens }) => {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-titan-muted">
        {tokens.map((token) => (
          <div
            key={token.symbol}
            className="h-full transition-all duration-300 ease-in-out cursor-pointer"
            style={{
              width: `${token.percentage}%`,
              backgroundColor: token.color,
              opacity: hoveredSymbol ? (hoveredSymbol === token.symbol ? 1 : 0.3) : 1,
            }}
            onMouseEnter={() => setHoveredSymbol(token.symbol)}
            onMouseLeave={() => setHoveredSymbol(null)}
          />
        ))}
      </div>
      
      {/* Legend / Tooltip replacement */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {tokens.map(token => (
          <div 
            key={token.symbol} 
            className={`flex items-center gap-1.5 transition-opacity duration-300 ${
              hoveredSymbol && hoveredSymbol !== token.symbol ? 'opacity-30' : 'opacity-100'
            }`}
            onMouseEnter={() => setHoveredSymbol(token.symbol)}
            onMouseLeave={() => setHoveredSymbol(null)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: token.color }} />
            <span className="text-xs text-titan-subtext font-medium">{token.symbol}</span>
            <span className="text-[10px] text-titan-tertiary">{token.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioBar;

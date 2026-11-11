import React, { useEffect, useRef, useState, useMemo } from 'react';

interface RealTimeChartProps {
  symbol: string;
  currentPrice: number;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ symbol, currentPrice }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const lastPriceRef = useRef<number>(currentPrice);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 300 });

  // Initialize simulated history when symbol changes
  useEffect(() => {
    const initialHistory: number[] = [];
    const base = currentPrice;
    // Generate 30 mock history points around the initial price
    for (let i = 0; i < 30; i++) {
      const variance = (Math.random() - 0.5) * (base * 0.02); // 2% variance
      initialHistory.push(Number((base + variance).toFixed(2)));
    }
    initialHistory.push(currentPrice);
    setHistory(initialHistory);
    lastPriceRef.current = currentPrice;
  }, [symbol]);

  // Append new tick to history
  useEffect(() => {
    if (currentPrice !== lastPriceRef.current) {
      setHistory(prev => {
        const next = [...prev, currentPrice];
        if (next.length > 40) {
          next.shift(); // Keep maximum 40 points
        }
        return next;
      });
      lastPriceRef.current = currentPrice;
    }
  }, [currentPrice]);

  // Responsive ResizeObserver for crisp Canvas drawing across any screen size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute High, Low, and Spread
  const stats = useMemo(() => {
    if (history.length === 0) return { high: currentPrice, low: currentPrice, spread: 0 };
    const high = Math.max(...history);
    const low = Math.min(...history);
    return { high, low, spread: high - low };
  }, [history, currentPrice]);

  // Draw chart onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate Min/Max for bounds
    const min = Math.min(...history) * 0.999;
    const max = Math.max(...history) * 1.001;
    const priceRange = max - min || 1;

    // Graph paddings
    const paddingLeft = 10;
    const paddingRight = 65;
    const paddingTop = 45;
    const paddingBottom = 25;

    const chartWidth = Math.max(10, width - paddingLeft - paddingRight);
    const chartHeight = Math.max(10, height - paddingTop - paddingBottom);

    // Convert coordinates helper
    const getX = (index: number) => {
      if (history.length <= 1) return paddingLeft;
      return paddingLeft + (index / (history.length - 1)) * chartWidth;
    };

    const getY = (price: number) => {
      return paddingTop + chartHeight - ((price - min) / priceRange) * chartHeight;
    };

    // Draw Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    // Draw 4 horizontal grid lines
    for (let i = 0; i <= 3; i++) {
      const yVal = min + (i / 3) * priceRange;
      const yPos = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(paddingLeft + chartWidth, yPos);
      ctx.stroke();

      // Draw Grid Price Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`$${yVal.toFixed(2)}`, paddingLeft + chartWidth + 8, yPos + 3);
    }
    ctx.setLineDash([]); // Reset line dash

    // Draw Gradient Area under Price Curve
    const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    const isUp = currentPrice >= (history[0] || currentPrice);
    if (isUp) {
      areaGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)'); // green
      areaGradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
    } else {
      areaGradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)'); // red
      areaGradient.addColorStop(1, 'rgba(239, 68, 68, 0.00)');
    }

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(getX(i), getY(history[i]));
    }
    ctx.lineTo(getX(history.length - 1), paddingTop + chartHeight);
    ctx.lineTo(getX(0), paddingTop + chartHeight);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw Glowing Price Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(getX(i), getY(history[i]));
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
    ctx.shadowBlur = 8;
    ctx.shadowColor = isUp ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Interactive Crosshair if hovering
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < history.length) {
      const hoverX = getX(hoverIndex);
      const hoverPrice = history[hoverIndex];
      const hoverY = getY(hoverPrice);

      // Vertical line
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, paddingTop);
      ctx.lineTo(hoverX, paddingTop + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.beginPath();
      ctx.arc(hoverX, hoverY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();

      // Tooltip Box
      const tipText = `$${hoverPrice.toFixed(2)}`;
      ctx.font = 'bold 11px monospace';
      const textWidth = ctx.measureText(tipText).width;
      const boxWidth = textWidth + 16;
      const boxHeight = 22;
      const boxX = Math.min(Math.max(hoverX - boxWidth / 2, paddingLeft), width - paddingRight - boxWidth);
      const boxY = Math.max(paddingTop - 26, 4);

      ctx.fillStyle = '#0b0f19';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.fillText(tipText, boxX + 8, boxY + 15);
    }

    // Draw Pulse Cursor on latest point
    if (history.length > 0) {
      const latestX = getX(history.length - 1);
      const latestY = getY(currentPrice);

      // Pulsing outer ring
      const pulseRadius = 6 + Math.sin(Date.now() / 150) * 2;
      ctx.beginPath();
      ctx.arc(latestX, latestY, pulseRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(latestX, latestY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
      ctx.fill();
    }
  }, [history, currentPrice, dimensions, hoverIndex]);

  // Handle Mouse / Touch Move for Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 10;
    const paddingRight = 65;
    const chartWidth = Math.max(10, rect.width - paddingLeft - paddingRight);
    const relX = Math.max(0, Math.min(x - paddingLeft, chartWidth));
    const index = Math.round((relX / chartWidth) * (history.length - 1));
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950/40 rounded-xl p-2 border border-slate-900 overflow-hidden">
      {/* Top Header stats bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-slate-100 tracking-wider">{symbol}</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            LIVE 1.5s
          </span>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono ml-2">
            <span>H: <span className="text-slate-200">${stats.high.toFixed(2)}</span></span>
            <span>L: <span className="text-slate-200">${stats.low.toFixed(2)}</span></span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="block font-semibold text-lg text-cyan-400 glow-cyan">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-crosshair" 
      />
    </div>
  );
};

export default RealTimeChart;

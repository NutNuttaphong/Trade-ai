import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useWebSockets } from '../../app/providers';
import { RealTimeChart } from '../../components/chart/RealTimeChart';
import { apiClient } from '../../services/api/client';
import { PortfolioItem } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Briefcase, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { stocks, lastTradeTimestamp, triggerTradeSync } = useWebSockets();
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Find currently selected stock object
  const activeStock = useMemo(() => {
    return stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  }, [stocks, selectedSymbol]);

  // Set initial selected symbol once stocks are loaded
  useEffect(() => {
    if (stocks.length > 0 && !selectedSymbol) {
      setSelectedSymbol(stocks[0].symbol);
    }
  }, [stocks, selectedSymbol]);

  // Load portfolio items
  const fetchPortfolio = async () => {
    try {
      const data = await apiClient.get<PortfolioItem[]>('/trade/portfolio');
      setPortfolio(data);
    } catch (e) {
      console.error('Failed to load portfolio on dashboard', e);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [lastTradeTimestamp]);

  // Calculate live portfolio market value
  const livePortfolioValue = useMemo(() => {
    return portfolio.reduce((sum, item) => {
      const liveStock = stocks.find(s => s.symbol === item.symbol);
      const price = liveStock ? liveStock.currentPrice : item.averagePrice;
      return sum + (price * item.quantity);
    }, 0);
  }, [portfolio, stocks]);

  // Handle Quick Trade Executions
  const handleQuickTrade = async (type: 'BUY' | 'SELL') => {
    if (quantity <= 0) return;
    setLoading(true);
    setStatus(null);
    try {
      const endpoint = type === 'BUY' ? '/trade/buy' : '/trade/sell';
      await apiClient.post(endpoint, {
        symbol: selectedSymbol,
        quantity: quantity
      });
      
      setStatus({
        type: 'success',
        message: `ทำรายการ ${type === 'BUY' ? 'ซื้อ' : 'ขาย'} ${quantity} หุ้นของ ${selectedSymbol} สำเร็จ!`
      });
      
      // Refresh context balance, sync event, & update portfolio details
      await refreshUser();
      await fetchPortfolio();
      triggerTradeSync();
      
      // Auto dismiss status message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'ทำรายการสั่งซื้อขายไม่สำเร็จ'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">ภาพรวมตลาดหุ้น</h1>
          <p className="text-sm text-slate-400">ข้อมูลราคาหุ้นเรียลไทม์ และพอร์ตการลงทุนจำลอง</p>
        </div>
        <div className="text-slate-400 text-xs flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>อัปเดตราคาแบบสุ่มความผันผวนทุก ๆ 1.5 วินาที</span>
        </div>
      </div>

      {/* Financial Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Balance */}
        <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-cyan-500/10">
            <Wallet className="h-12 w-12" />
          </div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">เงินสดคงเหลือ</div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            ${user?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>พร้อมสั่งซื้อหุ้นและตั้งค่าระบบออโต้</span>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/10">
            <Briefcase className="h-12 w-12" />
          </div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">มูลค่าหุ้นในพอร์ต (เรียลไทม์)</div>
          <div className="text-2xl font-bold text-emerald-400 glow-green mt-2">
            ${livePortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            ถือครองหุ้นทั้งหมด {portfolio.length} รายการ
          </div>
        </div>

        {/* Aggregate Asset Worth */}
        <div className="glassmorphism rounded-xl p-5 relative overflow-hidden bg-gradient-to-tr from-slate-900/80 to-cyan-950/20">
          <div className="absolute right-4 top-4 text-cyan-400/10">
            <ArrowUpRight className="h-12 w-12" />
          </div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">มูลค่าสินทรัพย์สุทธิ (Net Worth)</div>
          <div className="text-2xl font-bold text-cyan-400 glow-cyan mt-2">
            ${((user?.balance || 0) + livePortfolioValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <span>Cash ({Math.round(((user?.balance || 0) / ((user?.balance || 0) + livePortfolioValue || 1)) * 100)}%)</span>
            <span className="text-slate-600">•</span>
            <span>Stocks ({Math.round((livePortfolioValue / ((user?.balance || 0) + livePortfolioValue || 1)) * 100)}%)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Glowing Chart */}
        <div className="lg:col-span-2 glassmorphism rounded-xl p-5 h-[380px] flex flex-col justify-between">
          {activeStock ? (
            <RealTimeChart symbol={activeStock.symbol} currentPrice={activeStock.currentPrice} />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              กำลังเชื่อมต่อดึงข้อมูลกราฟเทรด...
            </div>
          )}
        </div>

        {/* Volatile Stock Watchlist */}
        <div className="glassmorphism rounded-xl p-5 flex flex-col h-[380px] overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-900 pb-3">Watchlist หุ้นเรียลไทม์</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pt-3">
            {stocks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">ไม่มีรายการหุ้นในระบบ</div>
            ) : (
              stocks.map(stock => {
                const isSelected = stock.symbol === selectedSymbol;
                const isUp = stock.changePercent >= 0;
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedSymbol(stock.symbol);
                      setStatus(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-slate-900 border-cyan-500/30' 
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs ${
                        isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {stock.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-200">{stock.symbol}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{stock.name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-xs text-slate-200">
                        ${stock.currentPrice.toFixed(2)}
                      </div>
                      <div className={`flex items-center justify-end text-[10px] font-bold ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action panel (Bottom Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick order Execution */}
        <div className="lg:col-span-2 glassmorphism rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">ส่งคำสั่งซื้อขายทันที (Market Order)</h2>
          
          {status && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs border ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  หุ้นที่เลือก
                </label>
                <div className="bg-slate-900 border border-slate-850 px-4 py-2 rounded-lg font-bold text-slate-200">
                  {selectedSymbol}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  ราคาล่าสุด (Market Price)
                </label>
                <div className="bg-slate-900 border border-slate-850 px-4 py-2 rounded-lg font-bold text-cyan-400">
                  ${activeStock ? activeStock.currentPrice.toFixed(2) : '-'}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  จำนวนหุ้น (Shares)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={() => handleQuickTrade('BUY')}
                disabled={loading || !activeStock}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors disabled:bg-slate-800 disabled:text-slate-500"
              >
                ซื้อ (Buy Stock)
              </button>
              <button
                onClick={() => handleQuickTrade('SELL')}
                disabled={loading || !activeStock}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-sm transition-colors disabled:bg-slate-800 disabled:text-slate-500"
              >
                ขาย (Sell Stock)
              </button>
            </div>
          </div>
        </div>

        {/* Small educational panel / system safety display */}
        <div className="glassmorphism rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Back-End Secured Processing</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              การคำนวณเงินปันผล ยอดเงินคงเหลือ ยอดสต็อกหุ้นในพอร์ตโฟลิโอ ตลอดจนเงื่อนไขราคาทริกเกอร์ระบบ Auto-Trade ดำเนินการตรวจสอบความปลอดภัยฝั่ง **Back-End (Spring Security + Database Transactional)** ป้องกันความพยายามแฮกข้อมูลด้วยการปรับแต่งค่าผ่าน DevTools บนเบราว์เซอร์ 100%
            </p>
          </div>
          <div className="mt-4 border-t border-slate-900 pt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span>Security Status: PROTECTED</span>
            <span className="text-emerald-500">TLS/SSL Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

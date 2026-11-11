import React, { useState, useEffect, useMemo } from 'react';
import { useWebSockets } from '../../app/providers';
import { apiClient } from '../../services/api/client';
import { PortfolioItem, Transaction } from '../../types';
import { 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  PieChart 
} from 'lucide-react';

export const Portfolio: React.FC = () => {
  const { stocks, lastTradeTimestamp } = useWebSockets();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial portfolio and transactions
  const loadData = async () => {
    setLoading(true);
    try {
      const [portData, txData] = await Promise.all([
        apiClient.get<PortfolioItem[]>('/trade/portfolio'),
        apiClient.get<Transaction[]>('/trade/transactions')
      ]);
      setPortfolio(portData);
      setTransactions(txData);
    } catch (e) {
      console.error('Failed to load portfolio details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastTradeTimestamp]);

  // Compute live holdings metrics
  const holdingsMetrics = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;

    const items = portfolio.map(item => {
      const liveStock = stocks.find(s => s.symbol === item.symbol);
      const currentPrice = liveStock ? liveStock.currentPrice : item.averagePrice;
      const costBasis = item.averagePrice * item.quantity;
      const marketValue = currentPrice * item.quantity;
      const profitLoss = marketValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

      totalCost += costBasis;
      totalValue += marketValue;

      return {
        ...item,
        name: liveStock ? liveStock.name : 'Unknown Stock',
        currentPrice,
        costBasis,
        marketValue,
        profitLoss,
        profitLossPercent
      };
    });

    const netProfitLoss = totalValue - totalCost;
    const netProfitLossPercent = totalCost > 0 ? (netProfitLoss / totalCost) * 100 : 0;

    return {
      items,
      totalCost,
      totalValue,
      netProfitLoss,
      netProfitLossPercent
    };
  }, [portfolio, stocks]);

  // Asset allocation percentages
  const allocations = useMemo(() => {
    const total = holdingsMetrics.totalValue || 1;
    return holdingsMetrics.items.map(item => ({
      symbol: item.symbol,
      percentage: (item.marketValue / total) * 100,
    })).sort((a, b) => b.percentage - a.percentage);
  }, [holdingsMetrics]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-cyan-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
          <span>กำลังประมวลผลข้อมูลสินทรัพย์...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">พอร์ตการลงทุน (Portfolio)</h1>
        <p className="text-sm text-slate-400">ตรวจสอบรายละเอียดหุ้นคงคลัง กำไร/ขาดทุน และประวัติการทำธุรกรรมของคุณ</p>
      </div>

      {/* Portfolio Financial Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glassmorphism rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">มูลค่าตลาดปัจจุบัน (Market Value)</div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            ${holdingsMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">คำนวณตามราคาตลาด ณ วินาทีล่าสุด</span>
        </div>

        <div className="glassmorphism rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">ต้นทุนรวมทั้งหมด (Total Cost)</div>
          <div className="text-2xl font-bold text-slate-400 mt-2">
            ${holdingsMetrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">ราคาเฉลี่ยที่ซื้อคูณด้วยจำนวนหุ้นคงค้าง</span>
        </div>

        <div className="glassmorphism rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">กำไร / ขาดทุนรวม (Total P&L)</div>
          <div className={`text-2xl font-bold mt-2 flex items-center gap-1.5 ${
            holdingsMetrics.netProfitLoss >= 0 ? 'text-emerald-400 glow-green' : 'text-rose-500 glow-red'
          }`}>
            {holdingsMetrics.netProfitLoss >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            <span>
              ${Math.abs(holdingsMetrics.netProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold">
              ({holdingsMetrics.netProfitLoss >= 0 ? '+' : ''}{holdingsMetrics.netProfitLossPercent.toFixed(2)}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">คำนวณจากต้นทุนเทียบราคาตลาดเรียลไทม์</span>
        </div>
      </div>

      {/* Main Grid: Holdings Table & Asset Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 glassmorphism rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-cyan-400" />
            รายการถือครองปัจจุบัน (Current Holdings)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">หุ้น (Symbol)</th>
                  <th className="p-3">จำนวนหุ้น</th>
                  <th className="p-3">ราคาเฉลี่ย</th>
                  <th className="p-3">ต้นทุนรวม</th>
                  <th className="p-3">ราคาล่าสุด</th>
                  <th className="p-3 text-right">กำไร / ขาดทุน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {holdingsMetrics.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">คุณยังไม่มีหุ้นในครอบครอง</td>
                  </tr>
                ) : (
                  holdingsMetrics.items.map(item => {
                    const profitLossVal = item.profitLoss;
                    const profitLossPercent = item.profitLossPercent;
                    return (
                      <tr key={item.symbol} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-3 font-bold">
                          <span className="text-slate-100">{item.symbol}</span>
                          <span className="block text-[10px] text-slate-500 font-normal">{item.name}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{item.quantity}</td>
                        <td className="p-3 text-slate-400">${item.averagePrice.toFixed(2)}</td>
                        <td className="p-3 text-slate-400">${item.costBasis.toFixed(2)}</td>
                        <td className="p-3 font-semibold text-slate-100">${item.currentPrice.toFixed(2)}</td>
                        <td className={`p-3 text-right font-bold ${
                          profitLossVal >= 0 ? 'text-emerald-400' : 'text-rose-500'
                        }`}>
                          <div>${profitLossVal >= 0 ? '+' : ''}{profitLossVal.toFixed(2)}</div>
                          <div className="text-[10px]">{profitLossVal >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="glassmorphism rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-cyan-400" />
            การสัดส่วนสินทรัพย์ (Asset Allocation)
          </h2>

          <div className="space-y-4">
            {allocations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">ไม่มีสัดส่วนการลงทุนเพื่อจัดแสดง</div>
            ) : (
              allocations.map(a => {
                const stockDetail = stocks.find(s => s.symbol === a.symbol);
                const isUp = stockDetail ? stockDetail.changePercent >= 0 : true;
                return (
                  <div key={a.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          isUp ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}></span>
                        <span>{a.symbol}</span>
                      </div>
                      <span className="text-slate-400">{a.percentage.toFixed(1)}%</span>
                    </div>
                    {/* Allocation Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isUp ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${a.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="glassmorphism rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          ประวัติการทำรายการย้อนหลัง (Transaction History)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">วันเวลา (Timestamp)</th>
                <th className="p-3">หุ้น (Symbol)</th>
                <th className="p-3">ประเภทรายการ</th>
                <th className="p-3">จำนวนหุ้น</th>
                <th className="p-3">ราคาที่ตกลง</th>
                <th className="p-3 text-right">มูลค่าธุรกรรมรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">ไม่มีประวัติการทำรายการธุรกรรม</td>
                </tr>
              ) : (
                transactions.slice(0, 10).map(tx => {
                  const date = new Date(tx.timestamp);
                  const isBuy = tx.type === 'BUY';
                  const total = tx.price * tx.quantity;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="p-3 text-slate-400">{date.toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-100">{tx.symbol}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{tx.quantity}</td>
                      <td className="p-3 text-slate-400">${tx.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-slate-200">${total.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {transactions.length > 10 && (
          <div className="mt-3 text-center text-[10px] text-slate-500">
            แสดงเฉพาะข้อมูลการทำรายการล่าสุด 10 รายการ
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;

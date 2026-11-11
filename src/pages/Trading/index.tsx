import React, { useState, useEffect } from 'react';
import { useAuth, useWebSockets } from '../../app/providers';
import { apiClient } from '../../services/api/client';
import { AutoTradeRule } from '../../types';
import { 
  ArrowLeftRight, 
  Cpu, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Clock 
} from 'lucide-react';

export const Trading: React.FC = () => {
  const { refreshUser } = useAuth();
  const { stocks, lastTradeTimestamp, triggerTradeSync } = useWebSockets();
  
  // Rules State
  const [rules, setRules] = useState<AutoTradeRule[]>([]);
  
  // Standard Order form State
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQty, setTradeQty] = useState(1);
  
  // Auto Trade Form State
  const [autoSymbol, setAutoSymbol] = useState('AAPL');
  const [autoType, setAutoType] = useState<'BUY' | 'SELL'>('BUY');
  const [autoTriggerPrice, setAutoTriggerPrice] = useState(150);
  const [autoQty, setAutoQty] = useState(1);

  // Status and Loaders
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch user's active auto-trade rules
  const fetchRules = async () => {
    try {
      const data = await apiClient.get<AutoTradeRule[]>('/trade/auto-rules');
      setRules(data);
    } catch (e) {
      console.error('Failed to fetch auto rules', e);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [lastTradeTimestamp]);

  // Update form inputs when selected stocks change to provide sensible defaults
  useEffect(() => {
    const selectedStock = stocks.find(s => s.symbol === autoSymbol);
    if (selectedStock) {
      // Set trigger price around current price as default hint
      setAutoTriggerPrice(Number(selectedStock.currentPrice.toFixed(2)));
    }
  }, [autoSymbol, stocks]);

  // Execute standard instant market order
  const handleMarketOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeQty <= 0) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const endpoint = tradeType === 'BUY' ? '/trade/buy' : '/trade/sell';
      await apiClient.post(endpoint, {
        symbol: tradeSymbol,
        quantity: tradeQty
      });
      
      setStatusMessage({
        type: 'success',
        message: `ส่งคำสั่งตลาดสำเร็จ: ${tradeType === 'BUY' ? 'ซื้อ' : 'ขาย'} ${tradeQty} หุ้น ${tradeSymbol} แล้ว!`
      });
      await refreshUser();
      triggerTradeSync();
      setTradeQty(1);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'ส่งคำสั่งตลาดไม่สำเร็จ'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit and create a new auto-trade rule
  const handleCreateAutoRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autoQty <= 0 || autoTriggerPrice <= 0) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      await apiClient.post('/trade/auto-rules', {
        symbol: autoSymbol,
        type: autoType,
        triggerPrice: autoTriggerPrice,
        quantity: autoQty
      });

      setStatusMessage({
        type: 'success',
        message: `ตั้งค่าบอทซื้อขายอัตโนมัติสำหรับ ${autoSymbol} สำเร็จ!`
      });
      
      setAutoQty(1);
      await fetchRules();
      triggerTradeSync();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'ตั้งระบบซื้อขายอัตโนมัติล้มเหลว'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel an active rule
  const handleCancelRule = async (ruleId: number) => {
    try {
      await apiClient.delete(`/trade/auto-rules/${ruleId}`);
      await fetchRules();
      triggerTradeSync();
      setStatusMessage({
        type: 'success',
        message: 'ยกเลิกคำสั่งซื้อขายอัตโนมัติแล้ว'
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'ยกเลิกคำสั่งไม่สำเร็จ'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">กระดานซื้อขายและบอทออโต้ (Trading Panel)</h1>
        <p className="text-sm text-slate-400">ส่งคำสั่งตลาดทันที หรือตั้งค่าระดับราคาสั่งซื้อขายแบบอัตโนมัติผ่านเซิร์ฟเวอร์หลังบ้าน</p>
      </div>

      {/* Dynamic Status Toast Notification banner */}
      {statusMessage && (
        <div className={`flex items-center gap-2.5 rounded-lg p-3 text-xs border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{statusMessage.message}</span>
        </div>
      )}

      {/* Grid: Instant Market Trade vs Auto-Trade setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instant Market Order Panel */}
        <div className="glassmorphism rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
            คำสั่งตลาดส่งด่วน (Market Order)
          </h2>

          <form onSubmit={handleMarketOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Target Symbol */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  เลือกหลักทรัพย์ (Stock)
                </label>
                <select
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  disabled={loading}
                >
                  {stocks.map(s => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol} (${s.currentPrice.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* BUY / SELL Action Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  ประเภทธุรกรรม (Action)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900">
                  <button
                    type="button"
                    onClick={() => setTradeType('BUY')}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                      tradeType === 'BUY' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('SELL')}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                      tradeType === 'SELL' 
                        ? 'bg-rose-500 text-slate-950' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            {/* Quantity and Price Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  จำนวนหลักทรัพย์ (Shares)
                </label>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  มูลค่าประมาณการ (Estimated Cost)
                </label>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-900 text-sm font-semibold text-cyan-400">
                  ${((stocks.find(s => s.symbol === tradeSymbol)?.currentPrice || 0) * tradeQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-bold text-sm text-slate-950 transition-colors shadow-lg ${
                tradeType === 'BUY' 
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10' 
                  : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/10'
              }`}
            >
              ส่งคำสั่งตลาดทันที ({tradeType})
            </button>
          </form>
        </div>

        {/* Auto-Trade conditional parameters Setting */}
        <div className="glassmorphism rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            ตั้งค่าสั่งการแบบอัตโนมัติ (Auto-Trade Trigger)
          </h2>

          <form onSubmit={handleCreateAutoRule} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  หลักทรัพย์เป้าหมาย (Stock)
                </label>
                <select
                  value={autoSymbol}
                  onChange={(e) => setAutoSymbol(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  disabled={loading}
                >
                  {stocks.map(s => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol} (${s.currentPrice.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* Action (BUY / SELL) */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  การทำงาน (Action Type)
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-900">
                  <button
                    type="button"
                    onClick={() => setAutoType('BUY')}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                      autoType === 'BUY' 
                        ? 'bg-cyan-500 text-slate-950' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoType('SELL')}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition-all ${
                      autoType === 'SELL' 
                        ? 'bg-cyan-500 text-slate-950' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto SELL
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Trigger Price */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  ราคาทริกเกอร์เป้าหมาย (Trigger Price $)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={autoTriggerPrice}
                    onChange={(e) => setAutoTriggerPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-7 pr-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  จำนวนหลักทรัพย์ (Shares)
                </label>
                <input
                  type="number"
                  min="1"
                  value={autoQty}
                  onChange={(e) => setAutoQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              เปิดใช้งานเงื่อนไขคำสั่ง (Deploy Auto-Trade Bot)
            </button>
          </form>
        </div>
      </div>

      {/* Auto Trade Trigger Rules Audit List */}
      <div className="glassmorphism rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          รายการบอทซื้อขายอัตโนมัติที่รันหลังบ้าน (Deployed Auto-Trade Rules)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">รหัส (Rule ID)</th>
                <th className="p-3">หุ้น (Symbol)</th>
                <th className="p-3">ประเภทคำสั่ง</th>
                <th className="p-3">จำนวนหุ้น</th>
                <th className="p-3">ราคาทริกเกอร์เป้าหมาย</th>
                <th className="p-3">ราคาตลาดปัจจุบัน</th>
                <th className="p-3">สถานะการทำงาน</th>
                <th className="p-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">ไม่มีบอททำงานอัตโนมัติในบัญชีนี้</td>
                </tr>
              ) : (
                rules.map(rule => {
                  const liveStock = stocks.find(s => s.symbol === rule.symbol);
                  const currentPrice = liveStock ? liveStock.currentPrice : null;
                  
                  // Compute price distance
                  let deltaText = '';
                  if (currentPrice && rule.status === 'ACTIVE') {
                    const diff = rule.triggerPrice - currentPrice;
                    if (rule.type === 'BUY') {
                      deltaText = diff >= 0 ? `ย่อตัวอีก $${diff.toFixed(2)}` : `เลยเป้ามา $${Math.abs(diff).toFixed(2)}`;
                    } else {
                      deltaText = diff <= 0 ? `บวกอีก $${Math.abs(diff).toFixed(2)}` : `ต่ำกว่าเป้า $${diff.toFixed(2)}`;
                    }
                  }

                  const isActive = rule.status === 'ACTIVE';
                  const isExecuted = rule.status === 'EXECUTED';
                  const isFailed = rule.status === 'FAILED';

                  return (
                    <tr key={rule.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="p-3 text-slate-550">#AT-{rule.id}</td>
                      <td className="p-3 font-bold text-slate-100">{rule.symbol}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.type === 'BUY' 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {rule.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{rule.quantity}</td>
                      <td className="p-3 font-semibold text-slate-200">${rule.triggerPrice.toFixed(2)}</td>
                      <td className="p-3 text-slate-400">
                        {currentPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                        {deltaText && (
                          <span className="block text-[9px] text-slate-500 font-normal">{deltaText}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse-slow' :
                          isExecuted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          isFailed ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {rule.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isActive ? (
                          <button
                            onClick={() => handleCancelRule(rule.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all"
                            title="ยกเลิกคำสั่งบอท"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">ไม่มีรายการ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trading;

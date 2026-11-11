import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers';
import { Navigate } from 'react-router-dom';
import { apiClient } from '../../services/api/client';
import { 
  Users, 
  RefreshCw, 
  Database, 
  Coins, 
  Activity, 
  Lock,
  Cpu,
  ShieldCheck,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Transaction } from '../../types';

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalActiveRules: number;
  totalStocks: number;
  totalUserBalances: number;
}

interface UserAccount {
  id: number;
  username: string;
  role: string;
  balance: number;
}

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Guard routing immediately at rendering time
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, txData] = await Promise.all([
        apiClient.get<AdminStats>('/admin/stats'),
        apiClient.get<UserAccount[]>('/admin/users'),
        apiClient.get<Transaction[]>('/admin/transactions')
      ]);
      setStats(statsData);
      setUsersList(usersData);
      setAllTransactions(txData);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ดูแลระบบ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAdjustBalance = async (targetUserId: number, amount: number) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.post(`/admin/users/${targetUserId}/balance`, { amount });
      setSuccessMsg(`เติมเงินทดสอบ $${amount.toLocaleString()} สำเร็จ!`);
      await loadAdminData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถปรับปรุงยอดเงินได้');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Lock className="h-6 w-6 text-rose-500" />
            แผงควบคุมผู้ดูแลระบบ (Admin Back-Office)
          </h1>
          <p className="text-sm text-slate-400">ตรวจสอบสถิติระบบ บริหารจัดการผู้ใช้งาน และรายงานความปลอดภัยทางธุรกรรม</p>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-850 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          สถิติภาพรวม (Overview)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          จัดการผู้ใช้งาน ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          ประวัติธุรกรรมรวมทั้งระบบ ({allTransactions.length})
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-3.5 text-xs text-rose-400 border border-rose-500/25">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-500/10 p-3.5 text-xs text-emerald-400 border border-emerald-500/25">
          {successMsg}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex h-[300px] items-center justify-center text-rose-400 font-medium">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
            <span>กำลังเรียกค้นข้อมูลความปลอดภัย...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6 animate-fade-in">
              {/* Analytics Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-cyan-400/5">
                    <Users className="h-10 w-10" />
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">บัญชีผู้ใช้ในระบบ</div>
                  <div className="text-2xl font-bold text-slate-100 mt-2">{stats.totalUsers}</div>
                  <span className="text-[9px] text-slate-500 block mt-1">ผู้ใช้ทั่วไป & ผู้ดูแลระบบ</span>
                </div>

                <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-emerald-400/5">
                    <Activity className="h-10 w-10" />
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">ธุรกรรมสั่งซื้อขายรวม</div>
                  <div className="text-2xl font-bold text-emerald-400 glow-green mt-2">{stats.totalTransactions}</div>
                  <span className="text-[9px] text-slate-500 block mt-1">สำเร็จผ่าน Transactional API</span>
                </div>

                <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-amber-400/5">
                    <Cpu className="h-10 w-10" />
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">คำสั่งบอทรันค้างไว้</div>
                  <div className="text-2xl font-bold text-amber-400 mt-2">{stats.totalActiveRules}</div>
                  <span className="text-[9px] text-slate-500 block mt-1">กำลังเช็คราคาทริกเกอร์</span>
                </div>

                <div className="glassmorphism rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-indigo-400/5">
                    <Database className="h-10 w-10" />
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">จำนวนหลักทรัพย์</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-2">{stats.totalStocks}</div>
                  <span className="text-[9px] text-slate-500 block mt-1">หุ้นบริษัทในตลาดจำลอง</span>
                </div>

                <div className="glassmorphism rounded-xl p-5 relative overflow-hidden lg:col-span-1 md:col-span-2">
                  <div className="absolute right-4 top-4 text-rose-400/5">
                    <Coins className="h-10 w-10" />
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">ยอดเงินรวมในระบบ</div>
                  <div className="text-2xl font-bold text-rose-400 glow-red mt-2">
                    ${stats.totalUserBalances.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-1">รวมวงเงินเครดิตซื้อขาย</span>
                </div>
              </div>

              {/* Database and Access details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glassmorphism rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Database className="h-4 w-4 text-rose-400" />
                    ตรวจสอบสถานะฐานข้อมูล (H2 Database State)
                  </h2>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-850">
                      <div>
                        <span className="font-semibold block text-slate-200">Database Engine</span>
                        <span className="text-[10px] text-slate-500">In-Memory relational SQL db</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CONNECTED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-850">
                      <div>
                        <span className="font-semibold block text-slate-200">H2 Console Path</span>
                        <span className="text-[10px] text-slate-500">Protected inside local network</span>
                      </div>
                      <span className="font-mono text-cyan-400">/h2-console</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-850">
                      <div>
                        <span className="font-semibold block text-slate-200">Persistence strategy</span>
                        <span className="text-[10px] text-slate-500">DDL-Auto Hibernate Update mode</span>
                      </div>
                      <span className="text-slate-400 font-medium">Stateless session validation</span>
                    </div>
                  </div>
                </div>

                <div className="glassmorphism rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-400" />
                    สิทธิ์ความปลอดภัยในระบบ (System Permissions Matrix)
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">สิทธิ์พนักงาน / แอดมิน (ADMIN)</span>
                        <span className="text-[10px] font-bold text-rose-400">FULL CONTROL</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        สามารถเข้าถึงข้อมูลสถิติรวมของเงินสดหมุนเวียน ดูทริกเกอร์บอท ซื้อขาย และดู H2 Console ได้จากพอร์ตัลผู้ควบคุม
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">สิทธิ์นักลงทุนทั่วไป (USER)</span>
                        <span className="text-[10px] font-bold text-cyan-400">TRADING ONLY</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        อนุญาตเฉพาะการจัดการพอร์ตตัวเอง ตั้งออโต้บอทสั่งการ ซื้อขายหลักทรัพย์ และใช้งานแชทผู้ช่วยเหลือ ไม่เห็นเมนูสถิติหลังบ้าน
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="glassmorphism rounded-xl p-5 animate-fade-in">
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-400" />
                รายชื่อบัญชีผู้ใช้งานในระบบทั้งหมด (User Directory)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">User ID</th>
                      <th className="p-3">ชื่อผู้ใช้ (Username)</th>
                      <th className="p-3">บทบาท (Role)</th>
                      <th className="p-3">ยอดเงินคงเหลือ (Cash Balance)</th>
                      <th className="p-3 text-right">การจัดการยอดเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-3 font-mono text-slate-500">#{u.id}</td>
                        <td className="p-3 font-bold text-slate-100">{u.username}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-400">
                          ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAdjustBalance(u.id, 10000)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <PlusCircle className="h-3 w-3 text-emerald-400" />
                              +$10K
                            </button>
                            <button
                              onClick={() => handleAdjustBalance(u.id, 50000)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <PlusCircle className="h-3 w-3 text-emerald-400" />
                              +$50K
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="glassmorphism rounded-xl p-5 animate-fade-in">
              <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-rose-400" />
                ประวัติธุรกรรมซื้อขายรวมทุกบัญชี (Global Transactions Trail)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">รหัสธุรกรรม</th>
                      <th className="p-3">วันเวลา (Timestamp)</th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">หลักทรัพย์ (Symbol)</th>
                      <th className="p-3">ประเภทคำสั่ง</th>
                      <th className="p-3">จำนวนหุ้น</th>
                      <th className="p-3">ราคาที่ตกลง</th>
                      <th className="p-3 text-right">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {allTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">ยังไม่มีประวัติการทำธุรกรรมในระบบ</td>
                      </tr>
                    ) : (
                      allTransactions.map(tx => {
                        const date = new Date(tx.timestamp);
                        const isBuy = tx.type === 'BUY';
                        const total = tx.price * tx.quantity;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-900/35 transition-colors">
                            <td className="p-3 font-mono text-slate-500">#TX-{tx.id}</td>
                            <td className="p-3 text-slate-400">{date.toLocaleString()}</td>
                            <td className="p-3 font-mono text-cyan-400">User #{tx.userId}</td>
                            <td className="p-3 font-bold text-slate-100">{tx.symbol}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {tx.type}
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;

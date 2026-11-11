import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth, useWebSockets } from '../app/providers';
import { 
  TrendingUp, 
  LayoutDashboard, 
  PieChart, 
  ArrowLeftRight, 
  ShieldAlert, 
  LogOut, 
  Bell, 
  X
} from 'lucide-react';
import { AiChatOverlay } from '../features/ai-assistant/AiChatOverlay';

export const MainLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { notifications, removeNotification } = useWebSockets();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
          <span>กำลังโหลดข้อมูลเซสชัน...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['USER', 'ADMIN'] },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart, roles: ['USER', 'ADMIN'] },
    { name: 'Trading', path: '/trading', icon: ArrowLeftRight, roles: ['USER', 'ADMIN'] },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert, roles: ['ADMIN'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Sidebar Navigation */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md md:flex md:flex-col">
        {/* Logo area */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-900 px-6">
          <TrendingUp className="h-6 w-6 text-cyan-400" />
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            ANTIGRAVITY TRADE
          </span>
        </div>

        {/* User profile */}
        <div className="border-b border-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 font-bold text-slate-950">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-200">{user.username}</div>
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                user.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-900/50 p-3 border border-slate-800/40">
            <div className="text-xs text-slate-400">ยอดเงินคงเหลือ</div>
            <div className="text-lg font-bold text-emerald-400 glow-green">
              ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 space-y-1 p-4">
          {navLinks
            .filter(link => link.roles.includes(user.role))
            .map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-400'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-900 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="h-5 w-5 text-rose-400" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 backdrop-blur-md">
          {/* Mobile view Logo placeholder */}
          <div className="flex items-center gap-2 md:hidden">
            <TrendingUp className="h-6 w-6 text-cyan-400" />
            <span className="font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              AG TRADE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>WebSocket Live Market Connection Active</span>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-4">
            {/* Balance in Header (Mobile) */}
            <div className="md:hidden text-right">
              <div className="text-[10px] text-slate-400">Balance</div>
              <div className="text-sm font-bold text-emerald-400">
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-sm">การแจ้งเตือนอัตโนมัติ</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">ไม่มีแจ้งเตือนใหม่</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="relative rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 text-xs">
                          <button
                            onClick={() => removeNotification(n.id)}
                            className="absolute right-1 top-1 text-slate-500 hover:text-slate-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="pr-4 text-slate-300">{n.message}</p>
                          <span className="mt-1 block text-[9px] text-slate-500">
                            {n.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Logout (Nav bar) */}
            <button
              onClick={logout}
              className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 md:hidden"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on < md screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/90 backdrop-blur-lg px-2 md:hidden">
        {navLinks
          .filter(link => link.roles.includes(user.role))
          .map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-cyan-500/15' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{link.name}</span>
              </Link>
            );
          })}
      </nav>

      {/* Floating Notifications (Toaster style in bottom-right) */}
      <div className="fixed bottom-24 md:bottom-20 right-4 md:right-6 z-40 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
        {notifications.slice(0, 3).map(n => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-md animate-bounce-short"
          >
            <div className="flex-1">
              <div className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                คำสั่งซื้อขายอัตโนมัติทำงาน
              </div>
              <p className="text-xs text-slate-200">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Embedded Global AI Assistant */}
      <AiChatOverlay />
    </div>
  );
};

export default MainLayout;

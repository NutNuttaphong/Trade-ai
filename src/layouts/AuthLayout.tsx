import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../app/providers';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-400 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
          <span>กำลังโหลดข้อมูลระบบความปลอดภัย...</span>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Glow Effects in Background */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glassmorphism rounded-2xl p-8 z-10 shadow-2xl relative border-slate-800">
        {/* Glow border overlay */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-500/20 pointer-events-none animate-pulse-slow"></div>
        <Outlet />
      </div>
      
      <div className="mt-6 text-slate-500 text-xs z-10">
        © 2026 Secured Stock Trading System. All rights reserved.
      </div>
    </div>
  );
};

export default AuthLayout;

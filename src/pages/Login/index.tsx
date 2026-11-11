import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { KeyRound, User as UserIcon, Lock, LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-3 border border-cyan-500/20">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">เข้าสู่ระบบ</h1>
        <p className="text-slate-400 text-sm mt-1">Secured Stock Trading Platform</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/25">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <UserIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านของคุณ"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 text-sm transition-colors shadow-lg shadow-cyan-500/20 disabled:bg-slate-800 disabled:text-slate-500"
          disabled={isSubmitting}
        >
          <LogIn className="h-4 w-4" />
          {isSubmitting ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

    </div>
  );
};

export default Login;

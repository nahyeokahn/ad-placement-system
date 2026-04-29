'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError('이메일과 비밀번호를 입력하세요.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError('로그인 실패: ' + (err.message || '이메일/비밀번호를 확인하세요.')); return; }
    router.push('/dashboard');
  }

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo">광</div>
        <div className="login-title">광고 게재 원표</div>
        <div className="login-sub">계속하려면 로그인하세요</div>
        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label>이메일</label>
            <input
              type="email"
              placeholder="이메일 주소"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <div className="login-err">{error}</div>
      </div>
    </div>
  );
}

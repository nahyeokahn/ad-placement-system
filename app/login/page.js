'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function checkEmailAllowed(emailToCheck) {
    try {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('email')
        .eq('email', emailToCheck)
        .maybeSingle();

      if (error) {
        console.error('Email check error:', error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('Email check exception:', err);
      return false;
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력하세요.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    // Check if email is allowed
    const isAllowed = await checkEmailAllowed(email);
    if (!isAllowed) {
      setLoading(false);
      setError('허용되지 않은 이메일입니다. 관리자에게 문의하세요.');
      return;
    }

    // Send magic link
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (err) {
      setError('메일 전송 실패: ' + (err.message || '다시 시도하세요.'));
      return;
    }

    setSent(true);
    setMessage('로그인 링크가 이메일로 전송되었습니다. 메일함을 확인하세요.');
  }

  if (sent) {
    return (
      <div id="login-screen" className="show">
        <div className="login-box">
          <div className="login-logo">광</div>
          <div className="login-title">로그인 링크 전송됨</div>
          <div className="login-success-msg">
            <p>{email}</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              이메일을 확인하고 로그인 링크를 클릭하세요.
            </p>
          </div>
          <button
            type="button"
            className="login-btn"
            onClick={() => {
              setSent(false);
              setEmail('');
              setMessage('');
            }}
          >
            다른 이메일로 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo">광</div>
        <div className="login-title">광고 게재 원표</div>
        <div className="login-sub">로그인 링크로 계속하세요</div>
        <form onSubmit={handleMagicLink}>
          <div className="login-field">
            <label>이메일</label>
            <input
              type="email"
              placeholder="이메일 주소"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '전송 중…' : '로그인 링크 받기'}
          </button>
        </form>
        {error && <div className="login-err">{error}</div>}
        {message && <div className="login-msg">{message}</div>}
      </div>
    </div>
  );
}

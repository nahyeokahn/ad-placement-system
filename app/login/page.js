'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/siteUrl';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('form'); // form | sent | pending | requested

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { setError('이메일을 입력하세요.'); return; }
    setLoading(true); setError('');

    const { data: existing, error: selectErr } = await supabase
      .from('allowed_emails')
      .select('email, status')
      .eq('email', email)
      .maybeSingle();

    if (selectErr) {
      setLoading(false);
      setError('확인 중 오류: ' + selectErr.message);
      return;
    }

    if (!existing) {
      const { error: insertErr } = await supabase
        .from('allowed_emails')
        .insert({ email, status: 'pending' });
      setLoading(false);
      if (insertErr) {
        setError('가입 신청 실패: ' + insertErr.message);
        return;
      }
      setMode('requested');
      return;
    }

    if (existing.status === 'pending') {
      setLoading(false);
      setMode('pending');
      return;
    }

    if (existing.status === 'rejected') {
      setLoading(false);
      setError('가입 신청이 거절되었습니다. 관리자에게 문의하세요.');
      return;
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    });
    setLoading(false);
    if (otpErr) {
      setError('메일 전송 실패: ' + (otpErr.message || '다시 시도하세요.'));
      return;
    }
    setMode('sent');
  }

  function reset() {
    setMode('form'); setEmail(''); setError('');
  }

  if (mode === 'sent') {
    return (
      <div id="login-screen" className="show">
        <div className="login-box">
          <div className="login-logo" aria-label="세계일보">세</div>
          <div className="login-brand">세계일보</div>
          <div className="login-title">로그인 링크 전송됨</div>
          <div className="login-success-msg">
            <p>{email}</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              이메일을 확인하고 로그인 링크를 클릭하세요.
            </p>
          </div>
          <button type="button" className="login-btn" onClick={reset}>
            다른 이메일로 시도
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'requested') {
    return (
      <div id="login-screen" className="show">
        <div className="login-box">
          <div className="login-logo" aria-label="세계일보">세</div>
          <div className="login-brand">세계일보</div>
          <div className="login-title">가입 신청 접수</div>
          <div className="login-success-msg">
            <p>{email}</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              관리자 승인 후 로그인 링크를 이메일로 보내드립니다.
            </p>
          </div>
          <button type="button" className="login-btn" onClick={reset}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'pending') {
    return (
      <div id="login-screen" className="show">
        <div className="login-box">
          <div className="login-logo" aria-label="세계일보">세</div>
          <div className="login-brand">세계일보</div>
          <div className="login-title">관리자 승인 대기 중</div>
          <div className="login-success-msg">
            <p>{email}</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              아직 관리자 승인이 완료되지 않았습니다.<br />
              승인이 완료되면 이메일로 로그인 링크가 발송됩니다.
            </p>
          </div>
          <button type="button" className="login-btn" onClick={reset}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo" aria-label="세계일보">세</div>
          <div className="login-brand">세계일보</div>
        <div className="login-title">광고 게재 원표</div>
        <div className="login-sub">로그인 또는 가입 신청</div>
        <form onSubmit={handleSubmit}>
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
            {loading ? '처리 중…' : '로그인 / 가입 신청'}
          </button>
        </form>
        {error && <div className="login-err">{error}</div>}
        <div className="login-msg" style={{ fontSize: 12, marginTop: 12 }}>
          처음 사용자는 이메일 입력 후 신청하면 관리자 승인 후 로그인 가능합니다.
        </div>
      </div>
    </div>
  );
}

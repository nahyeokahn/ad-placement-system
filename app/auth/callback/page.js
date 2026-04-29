'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        if (!data?.session) {
          setError('로그인 세션을 생성할 수 없습니다. 다시 시도하세요.');
          setLoading(false);
          return;
        }

        const userEmail = data.session.user?.email;
        const { data: row, error: checkErr } = await supabase
          .from('allowed_emails')
          .select('status')
          .eq('email', userEmail)
          .maybeSingle();

        if (checkErr) throw checkErr;

        if (row?.status !== 'approved') {
          await supabase.auth.signOut();
          setError('아직 관리자 승인이 완료되지 않았습니다.');
          setLoading(false);
          return;
        }

        router.push('/dashboard');
      } catch (err) {
        setError('오류 발생: ' + (err.message || '알 수 없는 오류'));
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div id="login-screen" className="show">
      <div className="login-box">
        <div className="login-logo">광</div>
        <div className="login-title">로그인 중…</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>로그인을 처리하는 중입니다. 잠시만 기다려주세요.</p>
          </div>
        ) : (
          <>
            <div className="login-err">{error}</div>
            <button
              type="button"
              className="login-btn"
              onClick={() => { window.location.href = '/login'; }}
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

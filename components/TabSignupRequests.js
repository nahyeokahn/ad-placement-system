'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TabSignupRequests({ onToast }) {
  const [rows, setRows] = useState([]);

  async function load() {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('id, email, status, requested_at, approved_at')
      .order('requested_at', { ascending: false, nullsFirst: false });
    if (error) { onToast('목록 로드 실패: ' + error.message, 'error'); return; }
    setRows(data || []);
  }

  useEffect(() => {
    let active = true;
    supabase
      .from('allowed_emails')
      .select('id, email, status, requested_at, approved_at')
      .order('requested_at', { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { onToast('목록 로드 실패: ' + error.message, 'error'); return; }
        setRows(data || []);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(row) {
    if (!confirm(`${row.email} 사용자를 승인하시겠어요?\n승인 후 로그인 링크가 이메일로 발송됩니다.`)) return;
    const { error: updateErr } = await supabase
      .from('allowed_emails')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', row.id);
    if (updateErr) { onToast('승인 실패: ' + updateErr.message, 'error'); return; }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: row.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (otpErr) {
      onToast(`승인됨, 메일 전송 실패: ${otpErr.message}`, 'error');
    } else {
      onToast(`${row.email} 승인 및 안내 메일 전송`, 'success');
    }
    await load();
  }

  async function reject(row) {
    if (!confirm(`${row.email} 사용자의 신청을 거절하시겠어요?`)) return;
    const { error } = await supabase
      .from('allowed_emails')
      .update({ status: 'rejected' })
      .eq('id', row.id);
    if (error) { onToast('거절 실패: ' + error.message, 'error'); return; }
    onToast(`${row.email} 거절됨`);
    await load();
  }

  async function remove(row) {
    if (!confirm(`${row.email} 항목을 삭제하시겠어요?`)) return;
    const { error } = await supabase.from('allowed_emails').delete().eq('id', row.id);
    if (error) { onToast('삭제 실패: ' + error.message, 'error'); return; }
    onToast(`${row.email} 삭제됨`);
    await load();
  }

  function fmtTime(s) {
    return s ? new Date(s).toLocaleString('ko-KR') : '-';
  }

  const pendingRows  = rows.filter(r => r.status === 'pending');
  const approvedRows = rows.filter(r => r.status === 'approved');
  const rejectedRows = rows.filter(r => r.status === 'rejected');

  return (
    <>
      <div className="card">
        <div className="card-title">
          승인 대기
          <span className="card-title-meta">{pendingRows.length}건</span>
        </div>
        {pendingRows.length === 0 ? (
          <div style={{padding:18, textAlign:'center', color:'var(--text3)', fontSize:13}}>
            대기 중인 신청이 없습니다.
          </div>
        ) : (
          <div className="signup-table-wrap">
            <table className="signup-table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th style={{width:170}}>신청 시각</th>
                  <th style={{width:170, textAlign:'right'}}>작업</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map(r => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td className="signup-time">{fmtTime(r.requested_at)}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn primary sm" onClick={() => approve(r)}>승인</button>
                      <button className="btn danger sm" style={{marginLeft:6}} onClick={() => reject(r)}>거절</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          승인 완료
          <span className="card-title-meta">{approvedRows.length}건</span>
        </div>
        <div className="signup-table-wrap">
          <table className="signup-table">
            <thead>
              <tr>
                <th>이메일</th>
                <th style={{width:170}}>승인 시각</th>
                <th style={{width:90, textAlign:'right'}}>작업</th>
              </tr>
            </thead>
            <tbody>
              {approvedRows.length === 0 ? (
                <tr><td colSpan={3} style={{textAlign:'center', color:'var(--text3)', padding:18}}>없음</td></tr>
              ) : approvedRows.map(r => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td className="signup-time">{fmtTime(r.approved_at)}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn danger sm" onClick={() => remove(r)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectedRows.length > 0 && (
        <div className="card">
          <div className="card-title">
            거절됨
            <span className="card-title-meta">{rejectedRows.length}건</span>
          </div>
          <div className="signup-table-wrap">
            <table className="signup-table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th style={{width:200, textAlign:'right'}}>작업</th>
                </tr>
              </thead>
              <tbody>
                {rejectedRows.map(r => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn primary sm" onClick={() => approve(r)}>다시 승인</button>
                      <button className="btn danger sm" style={{marginLeft:6}} onClick={() => remove(r)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

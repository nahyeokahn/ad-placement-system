'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, rowToRec, fmt, fmtDate } from '@/lib/supabase';
import TabInput from '@/components/TabInput';
import TabSearch from '@/components/TabSearch';
import TabStats from '@/components/TabStats';

const MANAGERS = ['공진건','김재호','김준영','박제선','신흥수','안나혁','양재준','이규원'];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('input');
  const [editRecord, setEditRecord] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, label: '' });
  const [detailSheet, setDetailSheet] = useState({ show: false, record: null });
  const toastTimer = useRef(null);

  function showToast(msg, type = '') {
    clearTimeout(toastTimer.current);
    setToast({ msg, type, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  }

  async function loadRecords() {
    const { data, error } = await supabase
      .from('ad_placements')
      .select('*, ad_agents(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { showToast('데이터 로드 실패: ' + error.message, 'error'); return; }
    setRecords((data || []).map(rowToRec));
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
      loadRecords();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push('/login');
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
    router.push('/login');
  }

  function handleEdit(record) {
    setEditRecord(record);
    setDetailSheet({ show: false, record: null });
    setActiveTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAskDelete(record) {
    setDeleteModal({ show: true, id: record.id, label: `${record.client} · ${fmtDate(record.date)}` });
  }

  async function handleConfirmDelete() {
    const { error } = await supabase.from('ad_placements').delete().eq('id', deleteModal.id);
    if (error) { showToast('삭제 실패: ' + error.message, 'error'); return; }
    setDeleteModal({ show: false, id: null, label: '' });
    setDetailSheet({ show: false, record: null });
    showToast('삭제되었습니다.', 'success');
    await loadRecords();
  }

  const userLabel = user ? (user.user_metadata?.name || user.email || '') : '';
  const userInitial = userLabel ? userLabel.charAt(0).toUpperCase() : '?';

  if (!user) return (
    <div id="app-loading">데이터 불러오는 중…</div>
  );

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="header-logo">광</div>
            <div className="header-title-wrap">
              <div className="header-title">광고 게재 원표</div>
              <div className="header-sub">Ad Placement Management</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-user" onClick={handleLogout}>
              <div className="user-avatar">{userInitial}</div>
              <div className="user-name">{userLabel}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tab-bar" role="tablist">
          {[['input','게재 입력'],['search','검색 / 조회'],['stats','통계']].map(([id, label]) => (
            <button
              key={id}
              className={`tab-btn${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
              role="tab"
            >{label}</button>
          ))}
        </div>

        <div className={`tab-panel${activeTab === 'input' ? ' active' : ''}`}>
          <TabInput
            key={editRecord?.id ?? 'new'}
            user={user}
            records={records}
            editRecord={editRecord}
            onClearEdit={() => setEditRecord(null)}
            onSaved={() => { loadRecords(); showToast(editRecord ? '수정되었습니다.' : '등록되었습니다.', 'success'); }}
            onToast={showToast}
            managers={MANAGERS}
          />
        </div>

        <div className={`tab-panel${activeTab === 'search' ? ' active' : ''}`}>
          <TabSearch
            records={records}
            onEdit={handleEdit}
            onDelete={handleAskDelete}
            onOpenDetail={r => setDetailSheet({ show: true, record: r })}
            onToast={showToast}
            managers={MANAGERS}
          />
        </div>

        <div className={`tab-panel${activeTab === 'stats' ? ' active' : ''}`}>
          {activeTab === 'stats' && <TabStats onToast={showToast} />}
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav" role="navigation">
        <div className="bottom-nav-inner">
          {[
            ['input','입력', <svg key="i" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>],
            ['search','조회', <svg key="s" width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>],
            ['stats','통계', <svg key="st" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>],
          ].map(([id, label, icon]) => (
            <button
              key={id}
              className={`bottom-nav-btn${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
              data-tab={id}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Delete modal */}
      {deleteModal.show && (
        <div className="modal-backdrop show" onClick={e => e.target === e.currentTarget && setDeleteModal(m => ({ ...m, show: false }))}>
          <div className="modal">
            <div className="modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="modal-title">정말 삭제하시겠어요?</div>
            <div className="modal-text">
              <strong>{deleteModal.label}</strong><br />이 작업은 되돌릴 수 없습니다.
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeleteModal(m => ({ ...m, show: false }))}>취소</button>
              <button className="btn danger solid" onClick={handleConfirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      {detailSheet.show && detailSheet.record && (
        <DetailSheet
          record={detailSheet.record}
          onClose={() => setDetailSheet({ show: false, record: null })}
          onEdit={() => handleEdit(detailSheet.record)}
          onDelete={() => handleAskDelete(detailSheet.record)}
          fmt={fmt}
          fmtDate={fmtDate}
        />
      )}

      {/* Toast */}
      <div className={`toast${toast.type ? ' ' + toast.type : ''}${toast.show ? ' show' : ''}`}>
        {toast.msg}
      </div>
    </>
  );
}

function DetailSheet({ record: r, onClose, onEdit, onDelete, fmt, fmtDate }) {
  const incentiveTotal = (r.agents || []).reduce((s, a) => s + (a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0), 0);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="detail-sheet show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-sheet-inner">
        <div className="detail-handle"></div>
        <div className="detail-header">
          <div className="detail-title">{r.client}</div>
          <button className="detail-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{display:'block',margin:'auto'}}><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="detail-grid">
          <Field label="게재일자">{fmtDate(r.date)}</Field>
          <Field label="대행사">{r.media || '-'}</Field>
          <Field label="신규/추가">{r.newtype || '-'}</Field>
          <Field label="분류">{r.category || '-'}</Field>
          <Field label="광고 사이즈">{r.size || '-'}</Field>
          <Field label="게재면">{r.page || '-'}</Field>
          <Field label="대행료">{r.agencyRate ? `${r.agencyRate}% (${(r.agencyFee||0).toLocaleString()}원)` : '-'}</Field>
          <Field label="담당자">{r.manager || '-'}</Field>
          <Field label="공급가액"><span className="amount">{fmt(r.supply)}</span></Field>
          <Field label="부가세"><span className="amount">{fmt(r.vat)}</span></Field>
          <Field label="합계" full><span className="amount accent" style={{fontSize:18}}>{fmt(r.total)}</span></Field>
          <Field label={`수주자${r.agents && r.agents.length ? ` · 인센티브 합계 ${incentiveTotal.toLocaleString()}원` : ''}`} full>
            {r.agents && r.agents.length
              ? r.agents.map((a, i) => {
                  const inc = a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0;
                  return <div key={i} style={{lineHeight:1.6}}>{a.name}{a.amount ? ` (${a.amount.toLocaleString()}원${a.rate ? `, ${a.rate}%) → ${inc.toLocaleString()}원` : ')'}` : ''}</div>;
                })
              : '-'}
          </Field>
          {r.note && <Field label="메모" full>{r.note}</Field>}
          <Field label="기록" full>
            <span style={{fontSize:11,color:'var(--text2)'}}>
              등록: {r.createdBy || '-'}{r.createdAt ? ' · ' + new Date(r.createdAt).toLocaleString('ko-KR') : ''}
            </span>
          </Field>
        </div>
        <div className="detail-actions">
          <button className="btn danger" onClick={onDelete}>삭제</button>
          <button className="btn primary" onClick={onEdit}>수정</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={`detail-field${full ? ' full' : ''}`}>
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{children}</div>
    </div>
  );
}

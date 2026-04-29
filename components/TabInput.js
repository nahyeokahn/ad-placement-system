'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const MANAGERS = ['공진건','김재호','김준영','박제선','신흥수','안나혁','양재준','이규원'];

function today() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

const emptyForm = () => ({
  date: today(), client: '', media: '', agencyRate: '', newtype: '', category: '',
  size: '', page: '', supply: '', vat: '', total: '', manager: '', note: '',
});

export default function TabInput({ user, records, editRecord, onClearEdit, onSaved, onToast }) {
  const [form, setForm] = useState(() => editRecord ? {
    date: editRecord.date || '', client: editRecord.client || '', media: editRecord.media || '',
    agencyRate: editRecord.agencyRate || '', newtype: editRecord.newtype || '', category: editRecord.category || '',
    size: editRecord.size || '', page: editRecord.page || '',
    supply: editRecord.supply || '', vat: editRecord.vat || '', total: editRecord.total || '',
    manager: editRecord.manager || '', note: editRecord.note || '',
  } : emptyForm());
  const [agents, setAgents] = useState(() => editRecord?.agents ? [...editRecord.agents] : []);
  const [vatModified, setVatModified] = useState(false);
  const [totalModified, setTotalModified] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', amount: '', rate: '' });
  const [saving, setSaving] = useState(false);
  const isEdit = editRecord != null;

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSupplyChange(val) {
    setField('supply', val);
    const supply = parseInt(val) || 0;
    setForm(f => {
      const newF = { ...f, supply: val };
      if (!vatModified) {
        newF.vat = supply ? String(Math.round(supply * 0.1)) : '';
      }
      if (!totalModified) {
        const vat = parseInt(vatModified ? f.vat : (supply ? String(Math.round(supply * 0.1)) : '')) || 0;
        newF.total = supply ? String(supply + vat) : '';
      }
      return newF;
    });
  }

  function handleVatChange(val) {
    setVatModified(true);
    setForm(f => {
      const newF = { ...f, vat: val };
      if (!totalModified) {
        const supply = parseInt(f.supply) || 0;
        const vat = parseInt(val) || 0;
        newF.total = (supply || vat) ? String(supply + vat) : '';
      }
      return newF;
    });
  }

  function handleTotalChange(val) {
    setTotalModified(true);
    setField('total', val);
  }

  function resetVat() {
    setVatModified(false);
    const supply = parseInt(form.supply) || 0;
    const autoVat = supply ? Math.round(supply * 0.1) : 0;
    setForm(f => {
      const newF = { ...f, vat: supply ? String(autoVat) : '' };
      if (!totalModified) newF.total = supply ? String(supply + autoVat) : '';
      return newF;
    });
  }

  function resetTotal() {
    setTotalModified(false);
    const supply = parseInt(form.supply) || 0;
    const vat = parseInt(form.vat) || 0;
    setField('total', (supply || vat) ? String(supply + vat) : '');
  }

  const supply = parseInt(form.supply) || 0;
  const agencyRate = parseInt(form.agencyRate) || 0;
  const agencyFee = supply && agencyRate ? Math.round(supply * agencyRate / 100) : 0;
  const showAmountPreview = supply || parseInt(form.vat) || parseInt(form.total);

  function addAgent() {
    const { name, amount, rate } = agentForm;
    if (!name) { onToast('수주자를 선택해주세요.', 'error'); return; }
    if (agents.find(a => a.name === name)) { onToast('이미 추가된 수주자입니다.', 'error'); return; }
    setAgents(prev => [...prev, { name, amount: parseInt(amount)||0, rate: parseFloat(rate)||0 }]);
    setAgentForm({ name: '', amount: '', rate: '' });
  }

  function removeAgent(i) {
    setAgents(prev => prev.filter((_, idx) => idx !== i));
  }

  function clearForm() {
    setForm(emptyForm());
    setAgents([]);
    setVatModified(false);
    setTotalModified(false);
    setAgentForm({ name: '', amount: '', rate: '' });
    onClearEdit();
  }

  async function handleSave() {
    if (!form.date || !form.client.trim() || !form.media.trim()) {
      const missing = [];
      if (!form.date) missing.push('게재일자');
      if (!form.client.trim()) missing.push('광고주');
      if (!form.media.trim()) missing.push('대행사');
      onToast(`필수 항목을 입력해주세요: ${missing.join(', ')}`, 'error');
      return;
    }
    setSaving(true);
    const row = {
      date: form.date || null,
      client: form.client.trim(),
      media: form.media.trim(),
      agency_rate: agencyRate,
      agency_fee: agencyFee,
      new_type: form.newtype || '',
      category: form.category || '',
      size: form.size.trim(),
      page_number: form.page.trim() || null,
      supply_amount: parseInt(form.supply) || 0,
      vat: parseInt(form.vat) || 0,
      total_amount: parseInt(form.total) || 0,
      manager: form.manager || '',
      note: form.note.trim(),
      created_by: user ? user.email : '',
    };

    let placementId = editRecord?.id;
    if (editRecord) {
      const { error } = await supabase.from('ad_placements').update(row).eq('id', editRecord.id);
      if (error) { onToast('수정 실패: ' + error.message, 'error'); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('ad_placements').insert(row).select('id').single();
      if (error) { onToast('등록 실패: ' + error.message, 'error'); setSaving(false); return; }
      placementId = data.id;
    }

    if (placementId) {
      await supabase.from('ad_agents').delete().eq('placement_id', placementId);
      if (agents.length) {
        await supabase.from('ad_agents').insert(agents.map(a => ({
          placement_id: placementId,
          agent_name: a.name,
          recognized_amount: a.amount || 0,
          incentive_rate: a.rate || 0,
          incentive_amount: a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0,
        })));
      }
    }

    setSaving(false);
    clearForm();
    onSaved();
  }

  const incentivePreview = agentForm.amount && agentForm.rate
    ? `→ ${Math.round((parseInt(agentForm.amount)||0) * (parseFloat(agentForm.rate)||0) / 100).toLocaleString()}원`
    : '';

  const agentTotal = agents.reduce((s, a) => s + (a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0), 0);

  return (
    <>
      <div className="form-title-bar">
        <div className="form-title-label">
          {isEdit ? '게재 수정 ' : '새 게재 등록 '}
          {isEdit && <span className="edit-pill show">수정 중</span>}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="card">
        <div className="card-title">기본 정보</div>
        <div className="grid-4">
          <div className="form-group">
            <label className="form-label">게재일자<span className="req">*</span></label>
            <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">광고주<span className="req">*</span></label>
            <input type="text" value={form.client} onChange={e => setField('client', e.target.value)} placeholder="예: 삼성전자" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">대행사<span className="req">*</span></label>
            <input type="text" value={form.media} onChange={e => setField('media', e.target.value)} placeholder="예: 제일기획" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">대행료</label>
            <select value={form.agencyRate} onChange={e => setField('agencyRate', e.target.value)}>
              <option value="">선택</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">담당자</label>
            <select value={form.manager} onChange={e => setField('manager', e.target.value)}>
              <option value="">선택</option>
              {MANAGERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{justifyContent:'flex-end'}}>
            {agencyFee > 0 && (
              <div className="agency-fee-badge" style={{display:'flex'}}>
                대행료: <span className="fee-val">{agencyFee.toLocaleString()}원</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 광고 정보 */}
      <div className="card">
        <div className="card-title">광고 정보</div>
        <div className="grid-4" style={{marginBottom:14}}>
          <div className="form-group">
            <label className="form-label">신규 / 추가</label>
            <select value={form.newtype} onChange={e => setField('newtype', e.target.value)}>
              <option value="">선택</option>
              <option value="신규">신규</option>
              <option value="추가">추가</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">분류</label>
            <select value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">선택</option>
              {['정부 부처','지자체','공기업','일반기업','생활광고'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">광고 사이즈</label>
            <input type="text" value={form.size} onChange={e => setField('size', e.target.value)} placeholder="예: 5단 15cm, 30초" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">게재면</label>
            <input type="text" value={form.page} onChange={e => setField('page', e.target.value)} placeholder="예: 1, 사회면, 전면" autoComplete="off" />
          </div>
        </div>

        {/* 금액 */}
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">공급가액</label>
            <input type="number" value={form.supply} onChange={e => handleSupplyChange(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">
              부가세
              {vatModified && (
                <span className="reset-link" style={{display:'inline-block'}} onClick={resetVat}>자동계산</span>
              )}
            </label>
            <input
              type="number"
              value={form.vat}
              onChange={e => handleVatChange(e.target.value)}
              placeholder="0"
              className={vatModified ? 'modified' : 'auto-field'}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              합계
              {totalModified && (
                <span className="reset-link" style={{display:'inline-block'}} onClick={resetTotal}>자동계산</span>
              )}
            </label>
            <input
              type="number"
              value={form.total}
              onChange={e => handleTotalChange(e.target.value)}
              placeholder="0"
              className={totalModified ? 'modified' : 'auto-field'}
            />
          </div>
        </div>

        {showAmountPreview ? (
          <div className="amount-preview" style={{display:'grid'}}>
            <div className="preview-box">
              <div className="preview-label">공급가액</div>
              <div className="preview-val">{supply ? supply.toLocaleString() + '원' : '-'}</div>
            </div>
            <div className="preview-box">
              <div className="preview-label">부가세</div>
              <div className="preview-val">{parseInt(form.vat) ? parseInt(form.vat).toLocaleString() + '원' : '-'}</div>
            </div>
            <div className="preview-box">
              <div className="preview-label">합계</div>
              <div className="preview-val accent">{parseInt(form.total) ? parseInt(form.total).toLocaleString() + '원' : '-'}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 수주자 */}
      <div className="card">
        <div className="card-title">
          수주자
          <span className="card-title-meta">
            {agents.length > 0 && `${agents.length}명 · 인센티브 합계 ${agentTotal.toLocaleString()}원`}
          </span>
        </div>
        <div className="sub-table-wrap">
          <table className="sub-table">
            <thead>
              <tr>
                <th>수주자</th><th>인정금액</th><th>인센티브율</th><th>인센티브</th><th></th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>추가된 수주자가 없습니다.</td></tr>
              ) : agents.map((a, i) => {
                const inc = a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0;
                return (
                  <tr key={i}>
                    <td>{a.name}</td>
                    <td style={{fontFamily:'monospace'}}>{a.amount ? a.amount.toLocaleString() + '원' : '-'}</td>
                    <td>{a.rate ? a.rate + '%' : '-'}</td>
                    <td style={{fontFamily:'monospace',color:'var(--accent)',fontWeight:500}}>{inc ? inc.toLocaleString() + '원' : '-'}</td>
                    <td><button className="row-btn danger" onClick={() => removeAgent(i)}>삭제</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 수주자 추가 */}
        <div className="add-agent-grid">
          <div className="form-group">
            <label className="form-label">수주자</label>
            <select value={agentForm.name} onChange={e => setAgentForm(f => ({...f, name: e.target.value}))}>
              <option value="">선택</option>
              {MANAGERS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">인정금액</label>
            <input type="number" value={agentForm.amount} onChange={e => setAgentForm(f => ({...f, amount: e.target.value}))} placeholder="0" />
            <div className="incentive-preview">{incentivePreview}</div>
          </div>
          <div className="form-group">
            <label className="form-label">인센티브율 (%)</label>
            <input type="number" value={agentForm.rate} onChange={e => setAgentForm(f => ({...f, rate: e.target.value}))} placeholder="0" step="0.1" />
          </div>
          <button className="btn sm" onClick={addAgent}>+ 추가</button>
        </div>
      </div>

      {/* 메모 */}
      <div className="card">
        <div className="card-title">메모</div>
        <div className="form-group">
          <textarea value={form.note} onChange={e => setField('note', e.target.value)} placeholder="비고 사항을 입력하세요" rows={3} />
        </div>
      </div>

      {/* 버튼 */}
      <div className="btn-row desktop-only" style={{display:'flex'}}>
        {isEdit && (
          <button className="btn" onClick={() => { if (confirm('수정을 취소하시겠어요?')) clearForm(); }}>취소</button>
        )}
        <button className="btn" onClick={() => { if (!isEdit || confirm('입력 중인 내용이 모두 지워집니다. 계속하시겠어요?')) { clearForm(); onToast('초기화되었습니다.'); } }}>초기화</button>
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : (isEdit ? '수정 저장' : '저장')}
        </button>
      </div>

      {/* FAB (mobile) */}
      <button className="fab-save show" onClick={handleSave} disabled={saving}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {saving ? '저장 중…' : (isEdit ? '수정 저장' : '저장')}
      </button>
    </>
  );
}

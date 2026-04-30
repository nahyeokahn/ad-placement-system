'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, rowToRec, fmt, fmtDate } from '@/lib/supabase';

const MANAGERS = ['공진건','김재호','김준영','박제선','신흥수','안나혁','양재준','이규원','사급'];
const AGENTS = [
  '강승우','강승훈','강은선','김건호','김동욱','김선덕','김세희','김수미',
  '김정모','박진영','배소영','오상도','오성택','윤교근','윤선영','이강은',
  '이영균','이천종','이현미','임성준','정성수','정재영','조성민','최현태',
];

export default function TabSearch({ records, onEdit, onDelete, onOpenDetail, onToast, managers }) {
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState({ from:'', to:'', manager:'', newtype:'', category:'', agencyRate:'', agent:'' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [resultSum, setResultSum] = useState(0);
  const debounceRef = useRef(null);

  // Combined unique 광고주 + 대행사 values from existing records, used as
  // <datalist> options so the search input autocompletes against the actual
  // DB values (prevents typo-driven misses).
  const suggestions = useMemo(() => {
    const map = new Map();
    for (const r of records || []) {
      for (const v of [r?.client, r?.media]) {
        const t = (v || '').trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (!map.has(k)) map.set(k, t);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [records]);

  const displayRows = results !== null ? results : records;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function doSearch(kw = keyword, flt = filters) {
    const kwL = kw.trim().toLowerCase();
    let q = supabase.from('ad_placements').select('*, ad_agents(*)').order('date', { ascending: false });
    if (flt.from) q = q.gte('date', flt.from);
    if (flt.to) q = q.lte('date', flt.to);
    if (flt.manager) q = q.eq('manager', flt.manager);
    if (flt.newtype) q = q.eq('new_type', flt.newtype);
    if (flt.category) q = q.eq('category', flt.category);
    if (flt.agencyRate) q = q.eq('agency_rate', flt.agencyRate);
    if (kwL) q = q.or(`client.ilike.%${kwL}%,media.ilike.%${kwL}%`);
    const { data, error } = await q;
    if (error) { onToast('검색 실패: ' + error.message, 'error'); return; }
    let res = (data || []).map(rowToRec);
    if (flt.agent) res = res.filter(r => r.agents && r.agents.some(a => a.name === flt.agent));
    setResults(res);
    setResultSum(res.reduce((a, r) => a + (r.total || 0), 0));
  }

  function handleQuickSearch(kw) {
    setKeyword(kw);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(kw, filters), 220);
  }

  async function resetSearch() {
    setKeyword('');
    setFilters({ from:'', to:'', manager:'', newtype:'', category:'', agencyRate:'', agent:'' });
    setResults(null);
    setResultSum(0);
    onToast('필터가 초기화되었습니다.');
  }

  return (
    <>
      <div className="search-card">
        <div className="search-quickbar">
          <div className="search-input-wrap">
            <input
              type="search"
              list="dl-search"
              placeholder="광고주, 대행사 검색…"
              value={keyword}
              onChange={e => handleQuickSearch(e.target.value)}
              autoComplete="off"
            />
            <datalist id="dl-search">
              {suggestions.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <button className="filter-toggle-btn" onClick={() => setFiltersOpen(o => !o)}>
            필터
            <span className="filter-count">{activeFilterCount > 0 ? activeFilterCount : ''}</span>
          </button>
        </div>

        <div className={`search-filters${filtersOpen ? ' open' : ''}`}>
          <div className="search-grid">
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">종료일</label>
              <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">담당자</label>
              <select value={filters.manager} onChange={e => setFilter('manager', e.target.value)}>
                <option value="">전체</option>
                {MANAGERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">신규 / 추가</label>
              <select value={filters.newtype} onChange={e => setFilter('newtype', e.target.value)}>
                <option value="">전체</option>
                <option value="신규">신규</option>
                <option value="추가">추가</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">분류</label>
              <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                <option value="">전체</option>
                {['정부 부처','지자체','공기업','일반기업','생활광고'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">수주자</label>
              <select value={filters.agent} onChange={e => setFilter('agent', e.target.value)}>
                <option value="">전체</option>
                {AGENTS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="search-actions">
          <button className="btn" onClick={resetSearch}>초기화</button>
          <button className="btn primary" onClick={() => doSearch()}>검색</button>
        </div>
      </div>

      {results !== null && (
        <div className="result-info">
          <span><span className="result-info-count">{results.length}건</span> 조회됨</span>
          {results.length > 0 && (
            <span className="result-info-sum">합계 {resultSum.toLocaleString()}원</span>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="main-table">
            <thead>
              <tr>
                <th style={{width:90}}>게재일자</th>
                <th style={{width:130}}>광고주</th>
                <th style={{width:110}}>대행사</th>
                <th style={{width:60}}>대행료</th>
                <th style={{width:60}}>신/추</th>
                <th style={{width:80}}>분류</th>
                <th style={{width:100}}>광고 사이즈</th>
                <th style={{width:50}}>면</th>
                <th style={{width:100}}>공급가액</th>
                <th style={{width:90}}>합계</th>
                <th style={{width:110}}>수주자</th>
                <th style={{width:70}}>담당자</th>
                <th style={{width:90}}>작업</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr className="empty-row"><td colSpan={13}>검색 결과가 없습니다.</td></tr>
              ) : displayRows.map(r => (
                <tr key={r.id} style={{cursor:'pointer'}} onClick={() => onOpenDetail(r)}>
                  <td>{fmtDate(r.date)}</td>
                  <td title={r.client} style={{fontWeight:500}}>{r.client}</td>
                  <td title={r.media||''}>{r.media||'-'}</td>
                  <td>{r.agencyRate ? <span className="badge badge-rate">{r.agencyRate}%</span> : '-'}</td>
                  <td>{r.newtype ? <span className={`badge ${r.newtype==='신규'?'badge-new':'badge-add'}`}>{r.newtype}</span> : '-'}</td>
                  <td>{r.category ? <span className="badge badge-cat">{r.category}</span> : '-'}</td>
                  <td title={r.size||''}>{r.size||'-'}</td>
                  <td>{r.page||'-'}</td>
                  <td style={{fontFamily:'monospace',fontSize:11}}>{fmt(r.supply)}</td>
                  <td style={{fontFamily:'monospace',fontSize:11,color:'var(--accent)',fontWeight:600}}>{fmt(r.total)}</td>
                  <td title={agentNames(r)}>{agentNames(r)}</td>
                  <td>{r.manager||'-'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn" onClick={e => { e.stopPropagation(); onEdit(r); }}>수정</button>
                      <button className="row-btn danger" onClick={e => { e.stopPropagation(); onDelete(r); }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="record-cards">
        {displayRows.length === 0 ? (
          <div className="empty-card">🔍 검색 결과가 없습니다.</div>
        ) : displayRows.map(r => {
          const tags = [];
          if (r.newtype) tags.push(<span key="nt" className={`badge ${r.newtype==='신규'?'badge-new':'badge-add'}`}>{r.newtype}</span>);
          if (r.category) tags.push(<span key="cat" className="badge badge-cat">{r.category}</span>);
          if (r.agencyRate) tags.push(<span key="ar" className="badge badge-rate">대행료 {r.agencyRate}%</span>);
          const names = r.agents && r.agents.length ? r.agents.map(a=>a.name).join(', ') : null;
          return (
            <div key={r.id} className="record-card" onClick={() => onOpenDetail(r)}>
              <div className="record-card-top">
                <div style={{minWidth:0,flex:1}}>
                  <div className="record-card-client">{r.client}</div>
                  <div className="record-card-media">{r.media||'-'}</div>
                </div>
                <div className="record-card-date">{fmtDate(r.date)}</div>
              </div>
              {tags.length > 0 && <div className="record-card-mid">{tags}</div>}
              <div className="record-card-bottom">
                <div className="record-card-amount">{fmt(r.total)}</div>
                <div className="record-card-meta">
                  {r.manager && <><strong>담당</strong> {r.manager}</>}
                  {names && <><br /><strong>수주</strong> {names.slice(0,30)}{names.length>30?'…':''}</>}
                </div>
              </div>
              <div className="record-card-actions">
                <button className="btn sm" onClick={e => { e.stopPropagation(); onEdit(r); }}>수정</button>
                <button className="btn sm danger" onClick={e => { e.stopPropagation(); onDelete(r); }}>삭제</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function agentNames(r) {
  return r.agents && r.agents.length ? r.agents.map(a => a.name).join(', ') : '-';
}

'use client';
import { useState, useEffect } from 'react';
import { supabase, rowToRec } from '@/lib/supabase';

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: toDateStr(from), to: toDateStr(to) };
}

function aggregate(rows, key) {
  const map = {};
  rows.forEach(r => {
    const k = r[key] || '미지정';
    if (!map[k]) map[k] = { count: 0, total: 0 };
    map[k].count++;
    map[k].total += (r.total || 0);
  });
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
}

function aggregateAgents(rows) {
  const map = {};
  rows.forEach(r => {
    (r.agents || []).forEach(a => {
      if (!map[a.name]) map[a.name] = { count: 0, total: 0, incentive: 0 };
      map[a.name].count++;
      map[a.name].total += (a.amount || 0);
      map[a.name].incentive += a.rate ? Math.round((a.amount||0) * a.rate / 100) : 0;
    });
  });
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
}

export default function TabStats({ onToast }) {
  const [range, setRange] = useState(defaultRange());
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => { fetchStats(range); }, []);

  async function fetchStats(r) {
    let q = supabase.from('ad_placements').select('*, ad_agents(*)');
    if (r.from) q = q.gte('date', r.from);
    if (r.to) q = q.lte('date', r.to);
    const { data, error } = await q;
    if (error) { onToast('통계 로드 실패: ' + error.message, 'error'); return; }
    const mapped = (data || []).map(rowToRec);
    setRows(mapped);
    setStats({
      count: mapped.length,
      supply: mapped.reduce((a, r) => a + (r.supply || 0), 0),
      vat: mapped.reduce((a, r) => a + (r.vat || 0), 0),
      total: mapped.reduce((a, r) => a + (r.total || 0), 0),
      newCount: mapped.filter(r => r.newtype === '신규').length,
      addCount: mapped.filter(r => r.newtype === '추가').length,
    });
  }

  function setPreset(preset) {
    const now = new Date();
    let from, to;
    if (preset === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'lastMonth') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'thisQuarter') {
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1);
      to = new Date(now.getFullYear(), q * 3 + 3, 0);
    } else {
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31);
    }
    const newRange = { from: toDateStr(from), to: toDateStr(to) };
    setRange(newRange);
    setActivePreset(preset);
    fetchStats(newRange);
  }

  function handleSearch() {
    setActivePreset('');
    fetchStats(range);
  }

  const clientData = aggregate(rows, 'client');
  const catData = aggregate(rows, 'category');
  const managerData = aggregate(rows, 'manager');
  const agentData = aggregateAgents(rows);

  return (
    <>
      <div className="date-range-row">
        <label>기간</label>
        <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
        <span className="date-sep">~</span>
        <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
        <button className="btn primary sm" onClick={handleSearch}>조회</button>
        <div className="preset-row">
          {[['thisMonth','이번 달'],['lastMonth','지난 달'],['thisQuarter','이번 분기'],['thisYear','올해']].map(([id, label]) => (
            <button
              key={id}
              className={`preset-btn${activePreset === id ? ' active' : ''}`}
              onClick={() => setPreset(id)}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="총 게재 건수" value={stats ? stats.count + '건' : '-'} />
        <StatCard label="공급가액 합계" value={stats ? stats.supply.toLocaleString() + '원' : '-'} green />
        <StatCard label="부가세 합계" value={stats ? stats.vat.toLocaleString() + '원' : '-'} />
        <StatCard label="총 합계" value={stats ? stats.total.toLocaleString() + '원' : '-'} green />
        <StatCard label="신규 건수" value={stats ? stats.newCount + '건' : '-'} />
        <StatCard label="추가 건수" value={stats ? stats.addCount + '건' : '-'} />
      </div>

      {stats && stats.count > 0 && (
        <>
          <div className="stats-section-label">상세 분석</div>
          <div className="stat-tables">
            <StatTable title="광고주별" headers={['광고주','건수','합계']} rows={clientData.map(([k,v]) => [k, v.count+'건', v.total.toLocaleString()+'원'])} />
            <StatTable title="분류별" headers={['분류','건수','합계']} rows={catData.map(([k,v]) => [k, v.count+'건', v.total.toLocaleString()+'원'])} />
            <StatTable title="담당자별" headers={['담당자','건수','합계']} rows={managerData.map(([k,v]) => [k, v.count+'건', v.total.toLocaleString()+'원'])} />
            <StatTable title="수주자별 인정금액" headers={['수주자','건수','인정금액','인센티브']} rows={agentData.map(([k,v]) => [k, v.count+'건', v.total.toLocaleString()+'원', v.incentive.toLocaleString()+'원'])} />
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, green }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${green ? ' green' : ''}`}>{value}</div>
    </div>
  );
}

function StatTable({ title, headers, rows }) {
  return (
    <div className="stat-table-card">
      <div className="stat-table-title">{title}</div>
      <table className="stat-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{color:'var(--text3)',padding:14,textAlign:'center',fontSize:12}}>데이터 없음</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

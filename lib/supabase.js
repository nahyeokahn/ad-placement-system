'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-ad-placement-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export function rowToRec(r) {
  return {
    id:         r.id,
    date:       r.date,
    client:     r.client,
    media:      r.media        || '',
    agencyRate: r.agency_rate  || 0,
    agencyFee:  r.agency_fee   || 0,
    newtype:    r.new_type     || '',
    category:   r.category     || '',
    size:       r.size         || '',
    page:       r.page_number  || '',
    supply:     r.supply_amount|| 0,
    vat:        r.vat          || 0,
    total:      r.total_amount || 0,
    manager:    r.manager      || '',
    note:       r.note         || '',
    createdBy:  r.created_by   || '',
    createdAt:  r.created_at,
    updatedAt:  r.updated_at,
    agents: (r.ad_agents || []).map(a => ({
      name:   a.agent_name,
      amount: a.recognized_amount,
      rate:   a.incentive_rate,
    })),
  };
}

export function fmt(n) {
  return n ? n.toLocaleString() + '원' : '-';
}

export function fmtDate(s) {
  if (!s) return '-';
  const parts = s.split('-');
  return parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2]}` : s;
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function agentNames(r) {
  return r.agents && r.agents.length ? r.agents.map(a => a.name).join(', ') : '-';
}

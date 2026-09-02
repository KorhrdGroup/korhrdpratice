'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';

type Payment = {
  id: string;
  name: string;
  phone: string;
  amount: number;
  goods_name: string;
  status: 'ready' | 'paid' | 'failed' | 'canceled';
  moid: string;
  tid: string | null;
  result_msg: string | null;
  paid_at: string | null;
  created_at: string;
  lms_synced: boolean | null;
  lms_sync_detail: string | null;
};

const STATUS_LABEL: Record<Payment['status'], { text: string; color: string; bg: string }> = {
  paid: { text: '결제완료', color: '#0b7a3b', bg: '#e6f7ed' },
  ready: { text: '시도중', color: '#8b95a1', bg: '#f2f4f6' },
  failed: { text: '실패', color: '#f04452', bg: '#fdecee' },
  canceled: { text: '취소', color: '#6b7684', bg: '#eef0f3' },
};

const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)) : '-';
const fmtPhone = (p: string) => p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Payment['status']>('paid');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }
      const res = await fetch('/api/admin/payments');
      if (res.ok) setRows(await res.json());
      setLoading(false);
    })();
  }, [router]);

  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const paidTotal = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);

  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#8b95a1', fontWeight: 600, borderBottom: '1px solid #e5e8eb', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 14, color: '#333d4b', borderBottom: '1px solid #f2f4f6', whiteSpace: 'nowrap' };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#191f28' }}>결제 내역</h1>
        <span style={{ fontSize: 14, color: '#6b7684' }}>
          결제완료 {rows.filter((r) => r.status === 'paid').length}건 · {paidTotal.toLocaleString()}원
        </span>
        <div style={{ flex: 1 }} />
        {(['paid', 'all', 'failed', 'ready'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
            background: filter === f ? '#3182f6' : '#f2f4f6', color: filter === f ? '#fff' : '#4e5968', fontWeight: filter === f ? 700 : 500,
          }}>
            {f === 'all' ? '전체' : STATUS_LABEL[f].text}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflowX: 'auto', border: '1px solid #e5e8eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>상태</th><th style={th}>이름</th><th style={th}>연락처</th><th style={th}>금액</th>
              <th style={th}>상품</th><th style={th}>결제일시</th><th style={th}>LMS 전달</th><th style={th}>주문번호</th><th style={th}>거래번호</th><th style={th}>비고</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={td} colSpan={10}>불러오는 중…</td></tr>
            ) : shown.length === 0 ? (
              <tr><td style={{ ...td, color: '#8b95a1' }} colSpan={10}>결제 내역이 없습니다.</td></tr>
            ) : shown.map((r) => {
              const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.ready;
              return (
                <tr key={r.id}>
                  <td style={td}><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: s.color, background: s.bg }}>{s.text}</span></td>
                  <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                  <td style={td}>{fmtPhone(r.phone)}</td>
                  <td style={td}>{r.amount.toLocaleString()}원</td>
                  <td style={td}>{r.goods_name}</td>
                  <td style={td}>{fmtDate(r.paid_at ?? (r.status === 'ready' ? r.created_at : null))}</td>
                  <td style={td} title={r.lms_sync_detail ?? ''}>
                    {r.status !== 'paid' ? '-' : r.lms_synced ? <span style={{ color: '#0b7a3b' }}>전달됨</span> : <span style={{ color: '#f04452' }}>미전달</span>}
                  </td>
                  <td style={{ ...td, fontSize: 12, color: '#8b95a1' }}>{r.moid}</td>
                  <td style={{ ...td, fontSize: 12, color: '#8b95a1' }}>{r.tid ?? '-'}</td>
                  <td style={{ ...td, fontSize: 12, color: '#8b95a1', whiteSpace: 'normal', minWidth: 160 }}>{r.result_msg ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '결제 결과',
  robots: { index: false },
};

const todayKst = () =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** 나이스페이 결제 결과 — 영수증 카드 한 장. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : '');
  const ok = pick('result') === 'ok';
  const amt = Number(pick('amt')) || 0;
  const moid = pick('moid');
  const message = pick('message');

  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14, padding: '10px 0', borderBottom: '1px solid #f2f4f6' };
  const label: React.CSSProperties = { color: '#8b95a1', flexShrink: 0 };
  const value: React.CSSProperties = { color: '#333d4b', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' };
  const btn: React.CSSProperties = { flex: 1, display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' };

  return (
    <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f2f4f6' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 6px 24px rgba(15,23,42,0.08)', padding: '40px 28px 28px', textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 12 }}>{ok ? '✅' : '❌'}</p>
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6, color: '#191f28' }}>
          {ok ? '결제가 완료되었습니다' : '결제가 완료되지 않았습니다'}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7684', marginBottom: 24 }}>
          {ok ? '결제 확인 후 담당자가 순차적으로 안내드립니다.' : message || '결제가 취소되었거나 실패했습니다. 다시 시도해주세요.'}
        </p>

        {ok ? (
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: '6px 18px', marginBottom: 24, textAlign: 'left' }}>
            <div style={row}><span style={label}>결제일</span><span style={value}>{todayKst()}</span></div>
            {moid ? <div style={row}><span style={label}>주문번호</span><span style={{ ...value, fontSize: 12.5, color: '#8b95a1' }}>{moid}</span></div> : null}
            <div style={{ ...row, borderBottom: 'none' }}>
              <span style={label}>결제금액</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#3182f6' }}>{amt.toLocaleString()}원</span>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8 }}>
          {ok ? (
            <Link href="/" style={{ ...btn, background: '#3182f6', color: '#fff' }}>홈으로</Link>
          ) : (
            <Link href="/pay" style={{ ...btn, background: '#3182f6', color: '#fff' }}>다시 결제하기</Link>
          )}
        </div>
      </div>
    </main>
  );
}

'use client';

import Script from 'next/script';
import { useRef, useState } from 'react';

declare global {
  interface Window {
    goPay?: (form: HTMLFormElement) => void;
    nicepaySubmit?: () => void;
    nicepayClose?: () => void;
  }
}

/**
 * 이름·휴대폰 번호 입력 → 나이스페이 결제창.
 *
 * 결제하기 → /api/nicepay/prepare 가 서명 파라미터를 만들어 주면 숨은 폼을 채워 goPay 호출.
 * PC는 인증 후 nicepaySubmit 콜백에서 폼이 /api/nicepay/return 으로 제출되고,
 * 모바일은 나이스페이가 ReturnURL(같은 주소)로 직접 POST 합니다.
 */
export default function PayForm({ amount, goodsName }: { amount: number; goodsName: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [pending, setPending] = useState(false);

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const canPay = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && agree && sdkReady && !pending;

  const pay = async () => {
    setError(null);
    setPending(true);
    try {
      const response = await fetch('/api/nicepay/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const prepared = await response.json();
      if (!response.ok) {
        setError(prepared.error ?? '결제 준비에 실패했습니다.');
        return;
      }

      const form = formRef.current;
      if (!form || !window.goPay) {
        setError('결제 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
        return;
      }

      const set = (key: string, value: string) => {
        (form.elements.namedItem(key) as HTMLInputElement).value = value;
      };
      set('MID', prepared.mid);
      set('Moid', prepared.moid);
      set('EdiDate', prepared.ediDate);
      set('SignData', prepared.signData);
      set('GoodsName', prepared.goodsName);
      set('Amt', prepared.amt);
      set('BuyerName', prepared.buyerName);
      set('BuyerTel', prepared.buyerTel);
      set('ReturnURL', `${window.location.origin}/api/nicepay/return`);

      const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
      if (isMobile) {
        /* 모바일 — 나이스페이 모바일 전용 페이지로 전체 화면 이동.
           인증이 끝나면 나이스페이가 ReturnURL로 결과를 POST 합니다. */
        form.action = 'https://web.nicepay.co.kr/v3/v3Payment.jsp';
        form.submit();
        return;
      }

      // PC: 레이어 팝업. 인증이 끝나면 나이스페이가 이 콜백을 부릅니다 → 서버로 제출해 승인 진행
      form.action = '/api/nicepay/return';
      window.nicepaySubmit = () => form.submit();
      window.nicepayClose = () => {
        setError('결제가 취소되었습니다.');
        setPending(false);
      };
      window.goPay(form);
    } catch {
      setError('결제 준비 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #e5e8eb',
    borderRadius: 12,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#4e5968', marginBottom: 8 };

  return (
    <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, boxShadow: '0 6px 24px rgba(15,23,42,0.08)', padding: '32px 24px' }}>
      <Script
        src="https://web.nicepay.co.kr/v3/webstd/js/nicepay-3.0.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191f28', marginBottom: 6 }}>{goodsName}</h1>
      <p style={{ fontSize: 14, color: '#6b7684', marginBottom: 24 }}>
        이름과 휴대폰 번호를 입력한 뒤 결제하기를 눌러주세요. 나이스페이 안전결제창이 열립니다.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="pay-name" style={labelStyle}>이름</label>
        <input id="pay-name" type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoComplete="name" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="pay-phone" style={labelStyle}>휴대폰 번호</label>
        <input id="pay-phone" type="tel" inputMode="numeric" placeholder="010-1234-5678" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} style={inputStyle} autoComplete="tel" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: '#8b95a1' }}>결제금액</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#3182f6' }}>{amount.toLocaleString()}원</span>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#6b7684', marginBottom: 20, cursor: 'pointer' }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          결제 진행을 위한 <a href="/privacy" target="_blank" style={{ color: '#3182f6' }}>개인정보 수집·이용</a>과 교육원(덧셈원격평생교육원) 제공에 동의합니다.
        </span>
      </label>

      {error ? <p style={{ color: '#f04452', fontSize: 14, marginBottom: 12 }}>{error}</p> : null}

      <button
        type="button"
        onClick={pay}
        disabled={!canPay}
        style={{
          width: '100%', padding: '16px', fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none',
          background: canPay ? '#3182f6' : '#d1d6db', color: '#fff', cursor: canPay ? 'pointer' : 'not-allowed',
        }}
      >
        {pending ? '결제창 여는 중…' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {/* 나이스페이 결제창용 숨은 폼 — 값은 결제하기 시점에 서버 서명으로 채웁니다 */}
      <form ref={formRef} name="nicepayForm" method="post" action="/api/nicepay/return" acceptCharset="euc-kr" style={{ display: 'none' }}>
        <input type="hidden" name="PayMethod" value="CARD" />
        <input type="hidden" name="GoodsName" defaultValue="" />
        <input type="hidden" name="Amt" defaultValue="" />
        <input type="hidden" name="MID" defaultValue="" />
        <input type="hidden" name="Moid" defaultValue="" />
        <input type="hidden" name="BuyerName" defaultValue="" />
        <input type="hidden" name="BuyerTel" defaultValue="" />
        <input type="hidden" name="ReturnURL" defaultValue="" />
        <input type="hidden" name="EdiDate" defaultValue="" />
        <input type="hidden" name="SignData" defaultValue="" />
        <input type="hidden" name="CharSet" value="utf-8" />
        <input type="hidden" name="GoodsCl" value="1" />
      </form>
    </div>
  );
}

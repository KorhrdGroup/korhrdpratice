/**
 * 덧셈원격평생교육원 LMS 연동.
 *
 * 결제가 승인되면 LMS에 "이 전화번호는 결제한 사람" 이라고 알립니다.
 * LMS는 나중에 같은 번호로 회원가입이 들어오면 결제자로 표시합니다.
 *
 * LMS 개발자에게서 아래 두 값을 받아 .env 에 넣으면 동작합니다.
 *   LMS_PAID_WEBHOOK_URL  — 결제 완료를 받을 주소 (POST, JSON)
 *   LMS_API_KEY           — 인증용 키 (Authorization: Bearer 로 전송)
 * 미설정이면 로그만 남기고 건너뜁니다. 전송 실패해도 결제 자체는 취소되지 않습니다.
 */

export type LmsPaidPayload = {
  /** 우리 쪽 주문번호 */
  moid: string;
  /** 나이스페이 거래번호 */
  tid: string | null;
  name: string;
  /** 숫자만 (예: 01012345678) */
  phone: string;
  amount: number;
  goodsName: string;
  paidAt: string;
  /** 발신처 식별용 고정값 */
  source: "korhrdeducation";
};

/** 하이픈·공백 제거 — LMS 쪽 매칭 키는 숫자만 있는 번호로 통일합니다. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export async function notifyLmsPaid(payload: LmsPaidPayload): Promise<{ ok: boolean; detail?: string }> {
  const url = process.env.LMS_PAID_WEBHOOK_URL?.trim();
  const apiKey = process.env.LMS_API_KEY?.trim();
  if (!url) {
    console.warn("[LMS] LMS_PAID_WEBHOOK_URL 미설정 — 결제 전달 건너뜀:", payload.moid);
    return { ok: false, detail: "not_configured" };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error("[LMS] 결제 전달 실패:", response.status, text);
      return { ok: false, detail: `${response.status} ${text}`.slice(0, 500) };
    }
    console.log("[LMS] 결제 전달 성공:", payload.moid);
    return { ok: true, detail: text.slice(0, 500) };
  } catch (error) {
    console.error("[LMS] 결제 전달 오류:", error);
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

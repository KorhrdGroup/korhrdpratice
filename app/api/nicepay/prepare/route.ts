import { NextResponse } from "next/server";

import { normalizePhone } from "@/lib/lms";
import { getNicepayConfig, nicepayEdiDate, signPaymentRequest } from "@/lib/nicepay";
import { getPayProduct } from "@/lib/pay-product";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * 결제창 호출 파라미터 준비 — 서명(SignData)을 서버에서 만들어 내려줍니다.
 * 금액은 클라이언트가 아니라 환경변수(PAY_AMOUNT)에서 정합니다.
 * 결제 확정은 /api/nicepay/return 이 승인 API까지 마친 뒤입니다.
 */

export async function POST(request: Request) {
  let body: { name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  if (name.length < 2) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!/^01\d{8,9}$/.test(phone)) {
    return NextResponse.json({ error: "휴대폰 번호를 확인해주세요." }, { status: 400 });
  }

  const { amount, goodsName } = getPayProduct();
  if (amount < 1000) {
    console.error("[나이스페이] PAY_AMOUNT 미설정 또는 1,000원 미만");
    return NextResponse.json({ error: "결제 금액이 설정되지 않았습니다. 관리자에게 문의해주세요." }, { status: 500 });
  }

  const { mid, merchantKey, isTest } = getNicepayConfig();
  const ediDate = nicepayEdiDate();
  const amt = String(amount);
  const moid = `edu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 결제 전에 주문을 먼저 기록(ready)합니다 — 모바일 결제창은 인증 콜백에
  // 금액을 돌려주지 않을 수 있어, 승인 단계 금액은 이 기록에서 찾습니다.
  const { error } = await supabaseAdmin.from("payments").insert({
    name,
    phone,
    amount,
    goods_name: goodsName,
    status: "ready",
    moid,
  });
  if (error) {
    console.error("[나이스페이] 주문 기록 실패:", error.message);
    return NextResponse.json({ error: "결제 준비에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  return NextResponse.json({
    mid,
    moid,
    ediDate,
    signData: signPaymentRequest(ediDate, mid, amt, merchantKey),
    goodsName,
    amt,
    buyerName: name,
    buyerTel: phone,
    isTest,
  });
}

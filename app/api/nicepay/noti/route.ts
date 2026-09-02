import { NextResponse } from "next/server";

import { normalizePhone } from "@/lib/lms";
import { getNicepayConfig } from "@/lib/nicepay";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * 나이스페이 결제 결과 통보(Noti) 수신.
 *
 * 나이스페이에 이 주소를 등록해 두면, 같은 MID 로 결제·취소가 일어날 때마다
 * (우리 결제 페이지든 외부 개발사 LMS 든) 나이스페이가 여기로 POST 합니다.
 * 받은 내용을 hpedu_practice_payments 에 거래번호(TID) 기준으로 넣어 오피스 탭에 보이게 합니다.
 *
 * 규격은 나이스페이 회신에 맞춰 조정합니다 — 필드명이 달라도 깨지지 않도록
 * 흔히 쓰는 이름을 여러 개 받아보고, 원문은 raw_noti 에 통째로 저장합니다.
 * 나이스페이는 응답 본문이 "OK" 여야 통보 성공으로 간주합니다.
 */

export const dynamic = "force-dynamic";

// 승인 성공 코드 (카드 3001 · 계좌이체 4000 · 가상계좌 입금 4100 · 휴대폰 A000)
const PAID_CODES = new Set(["3001", "4000", "4100", "A000"]);
// 취소 성공 코드 (카드 2001 · 가상계좌 환불 2201 · 계좌이체 2211 · 휴대폰 2301)
const CANCEL_CODES = new Set(["2001", "2201", "2211", "2301"]);

async function parseBody(request: Request): Promise<URLSearchParams> {
  const raw = Buffer.from(await request.arrayBuffer());
  const contentType = request.headers.get("content-type") ?? "";
  if (/json/i.test(contentType)) {
    const obj = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    return new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v ?? "")]));
  }
  const text = /euc-?kr|ksc/i.test(contentType)
    ? (await import("iconv-lite")).default.decode(raw, "euc-kr")
    : raw.toString("utf8");
  return new URLSearchParams(text);
}

/** "20260902141305" 또는 "2026-09-02 14:13:05" → ISO. 못 읽으면 지금 시각 */
function toIso(dateLike: string): string {
  const d = dateLike.replace(/\D/g, "");
  if (d.length >= 12) {
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:${d.slice(12, 14) || "00"}+09:00`;
    if (!Number.isNaN(Date.parse(iso))) return new Date(iso).toISOString();
  }
  return new Date().toISOString();
}

export async function POST(request: Request) {
  let params: URLSearchParams;
  try {
    params = await parseBody(request);
  } catch (error) {
    console.error("[나이스페이 노티] 본문 파싱 실패:", error);
    return new NextResponse("FAIL", { status: 400 });
  }

  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = params.get(k);
      if (v && v.trim()) return v.trim();
    }
    return "";
  };
  const raw = Object.fromEntries(params.entries());
  console.log("[나이스페이 노티] 수신 필드:", Object.keys(raw).join(","));

  const mid = get("MID", "Mid", "mid");
  const { mid: ourMid } = getNicepayConfig();
  if (mid && mid !== ourMid) {
    console.warn("[나이스페이 노티] 다른 MID 통보 무시:", mid);
    return new NextResponse("OK");
  }

  const tid = get("TID", "Tid", "tid");
  if (!tid) {
    console.error("[나이스페이 노티] TID 없음");
    return new NextResponse("OK");
  }

  const resultCode = get("ResultCode", "resultCode");
  const isCancel = CANCEL_CODES.has(resultCode) || !!get("CancelAmt", "CancelDate", "cancelledAt");
  const isPaid = PAID_CODES.has(resultCode) || get("Status", "status").toLowerCase() === "paid";
  const status = isCancel ? "canceled" : isPaid ? "paid" : "failed";

  const amount = Number(get("Amt", "amount", "CancelAmt").replace(/\D/g, "")) || 0;
  const name = get("BuyerName", "buyerName") || "이름없음";
  const phone = normalizePhone(get("BuyerTel", "buyerTel"));
  const goodsName = get("GoodsName", "goodsName") || "실습 결제비";
  const moid = get("Moid", "orderId") || `noti-${tid}`;
  const authAt = toIso(get("AuthDate", "paidAt", "CancelDate"));
  const resultMsg = get("ResultMsg", "resultMsg");

  // 같은 거래번호가 이미 있으면(우리 사이트 결제) 상태만 갱신, 없으면(외부 결제) 새로 넣는다
  const { data: existing } = await supabaseAdmin
    .from("hpedu_practice_payments")
    .select("id, status")
    .eq("tid", tid)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {
      result_code: resultCode || null,
      result_msg: resultMsg || null,
      raw_noti: raw,
      updated_at: new Date().toISOString(),
    };
    // 이미 취소된 건을 승인 통보가 늦게 와서 되살리지 않는다
    if (status === "canceled" || existing.status !== "canceled") patch.status = status;
    if (status === "paid" && existing.status !== "paid") patch.paid_at = authAt;
    const { error } = await supabaseAdmin.from("hpedu_practice_payments").update(patch).eq("id", existing.id);
    if (error) console.error("[나이스페이 노티] 갱신 실패:", error.message);
  } else {
    const { error } = await supabaseAdmin.from("hpedu_practice_payments").insert({
      name,
      phone: phone || "00000000000",
      amount,
      goods_name: goodsName,
      status,
      moid,
      tid,
      result_code: resultCode || null,
      result_msg: resultMsg || null,
      paid_at: status === "paid" ? authAt : null,
      source: "nicepay_noti",
      raw_noti: raw,
    });
    if (error) console.error("[나이스페이 노티] 기록 실패:", error.message);
  }

  return new NextResponse("OK");
}

/** 나이스페이가 등록 전 주소 확인용으로 GET 을 보내는 경우가 있어 살아있다는 응답만 준다 */
export async function GET() {
  return new NextResponse("OK");
}

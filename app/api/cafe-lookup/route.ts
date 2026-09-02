import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cafeId = searchParams.get('id');

  if (!cafeId) {
    return NextResponse.json({ error: '카페 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://cafe.naver.com/${cafeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });

    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);

    // og:title 또는 <title> 태그에서 카페명 추출
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);

    if (ogTitleMatch) {
      const raw = ogTitleMatch[1].replace(' : 네이버 카페', '').replace(' | 네이버 카페', '').trim();
      return NextResponse.json({ name: raw });
    }

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const raw = titleMatch[1].replace(' : 네이버 카페', '').replace(' | 네이버 카페', '').trim();
      return NextResponse.json({ name: raw });
    }

    return NextResponse.json({ error: '카페명을 찾을 수 없습니다.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }
}

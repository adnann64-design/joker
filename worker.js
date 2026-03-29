// ============================================================
// Cloudflare Worker — Gold Price Proxy
// يستخدم مفتاح GoldAPI.io الحقيقي
// ============================================================
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, max-age=0',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors })
  }

  // ── المصدر الأول: GoldAPI.io (مفتاحك الحقيقي) ──────────
  try {
    const r = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': 'goldapi-8xgjsmm8nx7u2-io',
        'Content-Type': 'application/json'
      }
    })
    const d = await r.json()
    if (d && d.price && d.price > 100) {
      return new Response(JSON.stringify({
        ok: true,
        price:  d.price,
        open:   d.open_price   || d.price,
        high:   d.high_price   || d.price,
        low:    d.low_price    || d.price,
        bid:    d.bid          || d.price - 0.5,
        ask:    d.ask          || d.price + 0.5,
        change: d.ch           || 0,
        change_pct: d.chp      || 0,
        ts:     d.timestamp    || Date.now(),
        source: 'GoldAPI.io ✅'
      }), { headers: cors })
    }
  } catch (e) {}

  // ── المصدر الثاني: GoldPrice.org (احتياطي) ───────────────
  try {
    const r = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://goldprice.org' }
    })
    const d = await r.json()
    const item = d.items[0]
    if (item && item.xauPrice > 100) {
      return new Response(JSON.stringify({
        ok: true,
        price:  item.xauPrice,
        open:   item.xauOpen  || item.xauPrice,
        high:   item.xauHigh  || item.xauPrice,
        low:    item.xauLow   || item.xauPrice,
        bid:    item.xauPrice - 0.3,
        ask:    item.xauPrice + 0.3,
        change: 0,
        change_pct: 0,
        ts:     Date.now(),
        source: 'GoldPrice.org ⚡'
      }), { headers: cors })
    }
  } catch (e) {}

  // ── المصدر الثالث: Gold-API.com (احتياطي 2) ──────────────
  try {
    const r = await fetch('https://gold-api.com/price/XAU')
    const d = await r.json()
    if (d && d.price > 100) {
      return new Response(JSON.stringify({
        ok: true,
        price:  d.price,
        open:   d.prev_close_price || d.price,
        high:   d.price,
        low:    d.price,
        bid:    d.price - 0.3,
        ask:    d.price + 0.3,
        change: 0,
        change_pct: 0,
        ts:     Date.now(),
        source: 'Gold-API.com ⚡'
      }), { headers: cors })
    }
  } catch (e) {}

  return new Response(
    JSON.stringify({ ok: false, error: 'all sources failed' }),
    { status: 502, headers: cors }
  )
}

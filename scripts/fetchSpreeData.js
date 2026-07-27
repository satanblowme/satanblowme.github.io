const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SPREE_BASE_URL = process.env.SPREE_API_URL || 'http://localhost:3000';
const SQUARE_ENV = process.env.SQUARE_ENV || 'sandbox';
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';

function readSquareMap() {
  const mapPath = path.join(__dirname, '../data/squareCheckoutMap.json');
  if (!fs.existsSync(mapPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  } catch {
    console.warn('⚠️ Could not parse data/squareCheckoutMap.json');
    return {};
  }
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getSku(product) {
  return (
    product.sku ||
    product.master?.sku ||
    product.default_variant?.sku ||
    (Array.isArray(product.variants) && product.variants[0]?.sku) ||
    ''
  );
}

function getSpreeId(product) {
  return String(product.id || '');
}

async function listSquarePaymentLinks() {
  if (!SQUARE_ACCESS_TOKEN) {
    console.warn('⚠️ SQUARE_ACCESS_TOKEN missing; skipping Square API lookup');
    return [];
  }

  const base =
    SQUARE_ENV === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

  const headers = {
    Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Square-Version': '2024-12-18',
    'Content-Type': 'application/json'
  };

  const results = [];
  let cursor = undefined;

  try {
    do {
      let links = [];
      let nextCursor;

      // Try SEARCH endpoint first
      try {
        const body = cursor ? { cursor, limit: 100 } : { limit: 100 };
        const res = await axios.post(
          `${base}/v2/online-checkout/payment-links/search`,
          body,
          { headers, timeout: 20000 }
        );
        links = res.data?.payment_links || [];
        nextCursor = res.data?.cursor;
      } catch {
        // Fallback to LIST endpoint
        const res = await axios.get(`${base}/v2/online-checkout/payment-links`, {
          headers,
          params: cursor ? { cursor, limit: 100 } : { limit: 100 },
          timeout: 20000
        });
        links = res.data?.payment_links || [];
        nextCursor = res.data?.cursor;
      }

      results.push(...links);
      cursor = nextCursor;
    } while (cursor);

    console.log(`✅ Pulled ${results.length} Square payment links (${SQUARE_ENV})`);
    return results;
  } catch (err) {
    const msg =
      err?.response?.data?.errors?.map((e) => e.detail).join('; ') ||
      err.message;
    console.warn(`⚠️ Square payment-link fetch failed: ${msg}`);
    return [];
  }
}

function buildSquareLookups(paymentLinks) {
  const bySpreeId = new Map();
  const bySku = new Map();
  const byName = new Map();

  for (const link of paymentLinks) {
    const url = link?.url || '';
    if (!url) continue;

    const meta = link?.order?.metadata || link?.checkout_options?.metadata || {};
    const spreeId =
      meta.spree_product_id ||
      meta.spree_id ||
      meta.product_id ||
      meta.spreeProductId;
    const sku = meta.sku || meta.product_sku || meta.spree_sku;

    const title =
      link?.description ||
      link?.order?.line_items?.[0]?.name ||
      link?.checkout_options?.custom_fields?.[0]?.title ||
      '';

    if (spreeId) bySpreeId.set(String(spreeId), url);
    if (sku) bySku.set(String(sku), url);
    if (title) byName.set(norm(title), url);
  }

  return { bySpreeId, bySku, byName };
}

async function fetchData() {
  try {
    console.log(`Fetching products from ${SPREE_BASE_URL}...`);

    const spreeResponse = await axios.get(`${SPREE_BASE_URL}/api/v3/store/products`, {
      params: { limit: 500 },
      headers: process.env.SPREE_API_KEY
        ? { 'x-spree-api-key': process.env.SPREE_API_KEY }
        : {},
      timeout: 15000
    });

    const payload = spreeResponse.data;
    const products = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const squareMap = readSquareMap(); // fallback map
    const paymentLinks = await listSquarePaymentLinks();
    const { bySpreeId, bySku, byName } = buildSquareLookups(paymentLinks);

    const merged = products.map((p) => {
      const idKey = getSpreeId(p);
      const skuKey = getSku(p);
      const nameKey = norm(p.name);

      const apiMatch =
        (idKey && bySpreeId.get(idKey)) ||
        (skuKey && bySku.get(skuKey)) ||
        (nameKey && byName.get(nameKey)) ||
        '';

      const fileMatch =
        (idKey && squareMap[idKey]) ||
        (skuKey && squareMap[skuKey]) ||
        (p.slug && squareMap[p.slug]) ||
        (p.name && squareMap[p.name]) ||
        '';

      const finalCheckout =
        p.checkout_url ||
        p.checkoutUrl ||
        p.square_checkout_url ||
        p.payment_link_url ||
        apiMatch ||
        fileMatch ||
        '';

      return {
        ...p,
        _sync_id: idKey,
        _sync_sku: skuKey,
        _sync_name: p.name || '',
        _square_source: apiMatch ? 'square-api' : fileMatch ? 'square-map' : '',
        checkout_url: finalCheckout
      };
    });

    const out = Array.isArray(payload?.data) ? { ...payload, data: merged } : merged;

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(out, null, 2));
    console.log(`✅ Saved ${merged.length} products to data/products.json`);

    const withCheckout = merged.filter((p) => p.checkout_url).length;
    console.log(`✅ Products with checkout links: ${withCheckout}/${merged.length}`);
  } catch (error) {
    const msg =
      error?.response?.data?.errors?.map((e) => e.detail).join('; ') ||
      error.message;
    console.error('❌ Error fetching products:', msg);
    process.exit(1);
  }
}

fetchData();
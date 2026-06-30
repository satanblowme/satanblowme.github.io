const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SPREE_BASE_URL = process.env.SPREE_API_URL || 'http://localhost:3000';

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function slug(s) { return String(s || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function getImg(p) {
  return p.site_image_url || p.thumbnail_url || p.image_url || p.images?.[0]?.url || p.images?.[0]?.original_url || '';
}
function absUrl(u) {
  if (!u) return '';
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${SPREE_BASE_URL.replace(/\/$/, '')}${u}`;
  return u;
}
function ext(u) {
  const m = (u.split('?')[0] || '').match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
  return m ? `.${m[1].toLowerCase()}` : '.jpg';
}

(async () => {
  const res = await axios.get(`${SPREE_BASE_URL}/api/v3/store/products`, {
    params: { limit: 500 },
    headers: process.env.SPREE_API_KEY ? { 'x-spree-api-key': process.env.SPREE_API_KEY } : {}
  });

  const payload = res.data || {};
  const products = payload.data || [];

  ensureDir(path.join(__dirname, '../data'));
  ensureDir(path.join(__dirname, '../public/img/products'));

  for (const p of products) {
    const img = absUrl(getImg(p));
    if (!img) continue;

    // SAFE deterministic filename
    const id = String(p.id || 'x').replace(/[^a-zA-Z0-9]/g, '');
    const name = slug(p.name || p.slug || 'product');
    const file = `${name}-${id}${ext(img)}`.toLowerCase();
    const out = path.join(__dirname, '../public/img/products', file);

    try {
      const r = await axios.get(img, { responseType: 'arraybuffer', timeout: 20000 });
      fs.writeFileSync(out, r.data);
      p.site_image_url = `/img/products/${file}`;
    } catch (e) {
      console.warn(`image mirror failed for ${p.name || p.id}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(__dirname, '../data/products.json'), JSON.stringify(payload, null, 2));
  console.log(`Saved ${products.length} products`);
})();
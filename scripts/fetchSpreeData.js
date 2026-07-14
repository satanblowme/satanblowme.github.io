const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SPREE_BASE_URL = process.env.SPREE_API_URL || 'http://localhost:3000';

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

function getSku(product) {
  return (
    product.sku ||
    (Array.isArray(product.variants) && product.variants[0] && product.variants[0].sku) ||
    ''
  );
}

async function fetchData() {
  try {
    console.log(`Fetching products from ${SPREE_BASE_URL}...`);

    const response = await axios.get(`${SPREE_BASE_URL}/api/v3/store/products`, {
      params: { limit: 500 },
      headers: process.env.SPREE_API_KEY
        ? { 'x-spree-api-key': process.env.SPREE_API_KEY }
        : {},
      timeout: 15000
    });

    const squareMap = readSquareMap();
    const payload = response.data;
    const products = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

    const merged = products.map((p) => {
      const sku = getSku(p);
      const squareUrl = sku ? squareMap[sku] || '' : '';

      return {
        ...p,
        checkout_url:
          p.checkout_url ||
          p.checkoutUrl ||
          p.square_checkout_url ||
          p.payment_link_url ||
          squareUrl ||
          ''
      };
    });

    const out = Array.isArray(payload?.data) ? { ...payload, data: merged } : merged;

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(out, null, 2));
    console.log(`✅ Saved ${merged.length} products to data/products.json`);
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    process.exit(1);
  }
}

fetchData();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SPREE_BASE_URL = process.env.SPREE_API_URL || 'http://localhost:3000';

async function fetchData() {
  try {
    console.log(`Fetching products from ${SPREE_BASE_URL}...`);

    const response = await axios.get(
      `${SPREE_BASE_URL}/api/v3/store/products`,
      {
        params: { limit: 500 },
        headers: process.env.SPREE_API_KEY
          ? { 'x-spree-api-key': process.env.SPREE_API_KEY }
          : {},
      }
    );

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, 'products.json'),
      JSON.stringify(response.data, null, 2)
    );

    const count = response.data.data ? response.data.data.length : 0;
    console.log(`✅ Saved ${count} products to data/products.json`);
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    process.exit(1);
  }
}

fetchData();

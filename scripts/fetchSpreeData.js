const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SPREE_API_URL = process.env.SPREE_API_URL || 'http://localhost:3000/api/v2';
const SPREE_API_KEY = process.env.SPREE_API_KEY;

async function fetchProducts() {
  try {
    console.log('Fetching products from Spree API...');
    const response = await axios.get(`${SPREE_API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${SPREE_API_KEY}`,
        'X-Spree-Token': SPREE_API_KEY
      },
      params: { per_page: 100 }
    });
    
    const products = response.data.data || response.data;
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
    console.log(`✅ Fetched ${products.length} products`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchProducts();

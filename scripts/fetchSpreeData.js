const fs = require('fs');
const path = require('path');

async function fetchData() {
  try {
    console.log('Skipping Spree API call (store not available)...');
    
    // Create placeholder data
    const placeholderData = [
      { name: 'Product 1', description: 'A great product', price: '29.99' },
      { name: 'Product 2', description: 'Another amazing item', price: '49.99' }
    ];

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dataDir, 'products.json'),
      JSON.stringify(placeholderData, null, 2)
    );

    console.log('✅ Created placeholder data');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchData();

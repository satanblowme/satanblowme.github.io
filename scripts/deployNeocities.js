const Neocities = require('neocities');
const fs = require('fs');
const path = require('path');

const NEOCITIES_API_TOKEN = process.env.NEOCITIES_API_TOKEN;

async function deploy() {
  try {
    if (!NEOCITIES_API_TOKEN) {
      throw new Error('NEOCITIES_API_TOKEN environment variable not set');
    }

    console.log('Deploying to Neocities...');
    
    const nc = new Neocities(NEOCITIES_API_TOKEN);
    const storeHtmlPath = path.join(__dirname, '../public/store.html');
    
    if (!fs.existsSync(storeHtmlPath)) {
      throw new Error('store.html not found. Run npm run generate-site first');
    }

    const fileContent = fs.readFileSync(storeHtmlPath);
    
    await nc.upload({
      'store.html': fileContent
    });

    console.log('✅ Successfully deployed to Neocities!');
  } catch (error) {
    console.error('❌ Error deploying to Neocities:', error.message);
    process.exit(1);
  }
}

deploy();

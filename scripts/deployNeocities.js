const Neocities = require('neocities');
const fs = require('fs');
const path = require('path');

const apiToken = process.env.NEOCITIES_API_TOKEN;

if (!apiToken) {
  console.error('❌ NEOCITIES_API_TOKEN not set');
  process.exit(1);
}

const nc = new Neocities(apiToken);

const filePath = path.join(__dirname, '../public/store.html');

if (!fs.existsSync(filePath)) {
  console.error('❌ store.html not found at', filePath);
  process.exit(1);
}

console.log('Uploading to Neocities...');

nc.upload({ name: 'store.html', src: filePath }, (err) => {
  if (err) {
    console.error('❌ Upload failed:', err);
    process.exit(1);
  }
  console.log('✅ Successfully deployed to Neocities!');
});

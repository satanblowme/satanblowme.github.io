const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiToken = process.env.NEOCITIES_API_TOKEN;

if (!apiToken) {
  console.error('❌ NEOCITIES_API_TOKEN not set');
  process.exit(1);
}

const filePath = path.join(__dirname, '../public/store.html');

if (!fs.existsSync(filePath)) {
  console.error('❌ store.html not found');
  process.exit(1);
}

console.log('Uploading to Neocities...');

try {
  const cmd = `curl -F "store.html=@${filePath}" -H "Authorization: Bearer ${apiToken}" https://neocities.org/api/upload`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ Successfully deployed to Neocities!');
} catch (error) {
  console.error('❌ Upload failed:', error.message);
  process.exit(1);
}

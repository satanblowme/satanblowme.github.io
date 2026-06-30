const { execSync } = require('child_process');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: repoRoot });
}

try {
  // 1. Fetch fresh product data from local Spree
  run('node scripts/fetchSpreeData.js');

  // 2. Commit and push data/products.json
  run('git add data/products.json');
  // Only commit if there are actual changes
  try {
    run('git diff --cached --quiet');
    console.log('No product changes to commit.');
  } catch (_) {
    run('git commit -m "chore: update products.json"');
    run('git push');
    console.log('\u2705 Products synced and pushed to GitHub');
    console.log('\ud83d\ude80 GitHub Actions will regenerate the site and deploy to Neocities');
  }
} catch (err) {
  console.error('\u274c Error during sync:', err.message);
  process.exit(1);
}

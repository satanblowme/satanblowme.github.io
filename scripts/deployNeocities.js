const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const token = process.env.NEOCITIES_API_TOKEN;
if (!token) {
  console.error('❌ NEOCITIES_API_TOKEN not set');
  process.exit(1);
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  console.error('❌ public directory not found');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

function promptYesNo(question) {
  process.stdout.write(question);
  const buf = fs.readFileSync(0, 'utf8').trim().toLowerCase();
  return buf === 'y' || buf === 'yes';
}

const files = walk(publicDir).filter((abs) => {
  const rel = path.relative(publicDir, abs).replace(/\\/g, '/');
  if (rel.endsWith('.DS_Store')) return false;
  return true;
});

if (!files.length) {
  console.error('❌ No files found in public/');
  process.exit(1);
}

const rels = files.map((abs) => path.relative(publicDir, abs).replace(/\\/g, '/'));
console.log(`\nAbout to upload ${rels.length} files from public/:`);
rels.slice(0, 40).forEach((r) => console.log(`  - ${r}`));
if (rels.length > 40) console.log(`  ...and ${rels.length - 40} more`);

if (!promptYesNo('\nProceed with full public/ sync to Neocities? (y/N): ')) {
  console.log('Cancelled.');
  process.exit(0);
}

for (let i = 0; i < files.length; i++) {
  const abs = files[i];
  const rel = path.relative(publicDir, abs).replace(/\\/g, '/');
  const remote = rel.split('/').map(encodeURIComponent).join('/');

  try {
    console.log(`⬆️  [${i + 1}/${files.length}] ${rel}`);
    const out = execFileSync(
      'curl',
      [
        '--fail',
        '--silent',
        '--show-error',
        '--connect-timeout', '10',
        '--max-time', '45',
        '--retry', '2',
        '--retry-delay', '1',
        '-H', `Authorization: Bearer ${token}`,
        '-F', `${remote}=@${abs}`,
        'https://neocities.org/api/upload',
      ],
      { encoding: 'utf8' }
    );
    if (out && out.trim()) console.log(`   ${out.trim()}`);
  } catch (e) {
    console.error(`❌ Failed: ${rel}`);
    console.error(e.stderr?.toString?.() || e.message);
    process.exit(1);
  }
}

console.log('\n✅ Full public/ sync complete.');
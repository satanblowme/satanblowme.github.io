const required = {
  sync: ["SPREE_API_URL", "SPREE_API_KEY"],
  deploy: ["SPREE_API_URL", "SPREE_API_KEY", "NEOCITIES_API_TOKEN"],
};

const mode = process.argv[2]; // "sync" or "deploy"
if (!mode || !required[mode]) {
  console.error("Usage: node scripts/checkEnv.js <sync|deploy>");
  process.exit(1);
}

const missing = required[mode].filter((k) => {
  const v = process.env[k];
  return !v || !String(v).trim();
});

if (missing.length) {
  console.error(`❌ Missing required env vars for ${mode}: ${missing.join(", ")}`);
  console.error("Tip: define them in .env (repo root).");
  process.exit(1);
}

console.log(`✅ Env check passed for ${mode}`);
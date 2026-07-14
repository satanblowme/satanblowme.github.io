#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const SPREE_API_URL = process.env.SPREE_API_URL;
const SPREE_API_KEY = process.env.SPREE_API_KEY;

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SQUARE_ENV = (process.env.SQUARE_ENV || "sandbox").toLowerCase();

if (!SPREE_API_URL || !SPREE_API_KEY) {
  console.error("Missing SPREE_API_URL or SPREE_API_KEY in .env");
  process.exit(1);
}
if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
  console.error("Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID in .env");
  process.exit(1);
}

const squareBase =
  SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

async function fetchSpreeProducts() {
  const url = `${SPREE_API_URL.replace(/\/$/, "")}/api/v2/storefront/products`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SPREE_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Spree fetch failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data || [];
}

function centsFromPrice(price) {
  const n = Number(price || 0);
  return Math.round(n * 100);
}

async function createSquarePaymentLink(product) {
  const name = product.attributes?.name || "Product";
  const slug = product.attributes?.slug || product.id;
  const price = product.attributes?.price || "0.00";
  const amount = centsFromPrice(price);

  const body = {
    idempotency_key: `spree-${slug}-${amount}`,
    quick_pay: {
      name,
      price_money: {
        amount,
        currency: "USD",
      },
      location_id: SQUARE_LOCATION_ID,
    },
    checkout_options: {
      redirect_url: "",
    },
  };

  const res = await fetch(`${squareBase}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": "2025-10-16",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Square payment link failed for ${slug}: ${res.status} ${await res.text()}`
    );
  }

  const json = await res.json();
  return json.payment_link?.url || null;
}

async function main() {
  const spreeProducts = await fetchSpreeProducts();

  const output = [];
  for (const p of spreeProducts) {
    try {
      const checkoutUrl = await createSquarePaymentLink(p);
      output.push({
        id: p.id,
        name: p.attributes?.name || "",
        description: p.attributes?.description || "",
        slug: p.attributes?.slug || "",
        price: p.attributes?.price || "0.00",
        currency: "USD",
        image_url: p.relationships?.images?.data?.[0]?.id || null,
        checkout_url: checkoutUrl,
      });
      console.log(`✔ synced ${p.attributes?.slug || p.id}`);
    } catch (err) {
      console.error(`✖ ${p.attributes?.slug || p.id}: ${err.message}`);
    }
  }

  const outPath = path.join(process.cwd(), "data", "products.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${output.length} products -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
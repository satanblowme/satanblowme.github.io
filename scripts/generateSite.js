const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveProductImage(product) {
  return (
    product.site_image_url ||
    product.thumbnail_url ||
    product.image_url ||
    (product.images &&
      product.images[0] &&
      (product.images[0].url || product.images[0].original_url)) ||
    ''
  );
}

function resolveCheckoutUrl(product) {
  return (
    product.checkout_url ||
    product.checkoutUrl ||
    product.square_checkout_url ||
    product.payment_link_url ||
    ''
  );
}

function getDisplayPrice(product) {
  if (product?.price?.display_amount) return product.price.display_amount;
  if (typeof product?.price === 'string') return product.price;
  return '';
}

async function generateSite() {
  try {
    console.log('Generating static site...');

    const dataPath = path.join(__dirname, '../data/products.json');
    let products = [];

    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      // v3 API response: { data: [...], meta: {...} }
      products = parsed.data || parsed;
    }

    const outputDir = path.join(__dirname, '../public');
    const productsOutputDir = path.join(outputDir, 'products');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(productsOutputDir)) fs.mkdirSync(productsOutputDir, { recursive: true });

    // Build stable, unique slugs
    const usedSlugs = new Set();
    const productsWithMeta = products.map((product, index) => {
      const baseSlug = slugify(product.slug || product.name || product.id || `product-${index + 1}`) || `product-${index + 1}`;
      let slug = baseSlug;
      let n = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${n++}`;
      }
      usedSlugs.add(slug);

      return {
        ...product,
        _slug: slug,
        _img: resolveProductImage(product),
        _checkoutUrl: resolveCheckoutUrl(product),
        _displayPrice: getDisplayPrice(product),
      };
    });

    const storeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>shop — satanblowme</title>
  <link href="https://fonts.googleapis.com/css?family=Slabo+27px&display=swap" rel="stylesheet">
  <link href="/style.css" rel="stylesheet" type="text/css" media="all">
  <style>
    html {
      background: url(img/230.GIF) repeat;
    }
    .shop-heading {
      font-family: 'Slabo 27px', serif;
      color: #fff;
      text-align: center;
      font-size: 1.4em;
      margin: 20px 0 10px;
      letter-spacing: 0.05em;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .product-card {
      background: rgba(255, 255, 255, 0.92);
      border-radius: 8px;
      box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      font-family: 'Slabo 27px', serif;
      color: #333;
      transition: transform 0.2s;
    }
    .product-card:hover {
      transform: translateY(-3px);
    }
    .product-card img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
    }
    .no-img {
      width: 100%;
      height: 220px;
      background: #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 0.85em;
    }
    .product-info {
      padding: 10px 12px 14px;
    }
    .product-name {
      font-size: 1em;
      font-weight: bold;
      margin: 0 0 6px;
      color: #222;
    }
    .product-price {
      color: #cc3333;
      font-size: 1.1em;
      font-weight: bold;
      margin: 0;
    }
    .product-desc {
      font-size: 0.8em;
      color: #666;
      margin: 6px 0 0;
      line-height: 1.4;
    }
    .empty-msg {
      text-align: center;
      color: #fff;
      font-family: 'Slabo 27px', serif;
      margin-top: 40px;
    }
    .product-links {
      margin-top: 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .product-btn {
      display: inline-block;
      background: #111;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85em;
    }
    .product-btn.alt {
      background: #444;
    }
  </style>
</head>
<body>
  <div class="satanblowme"><img src="img/satanblowme.gif"></div>
  <br>
  <div class="header">
    <a href="index.html"><img src="img/about_us.gif" style="width:auto;max-height:30px;"></a>
    <a href="cursed_imgs.html"><img src="img/art.gif" style="width:auto;max-height:70px;"></a>
    <a href="collections.html"><img src="img/collections.gif" width="280" height="40" style="object-fit:cover;"></a>
  </div>
  <br>

  <p class="shop-heading">shop</p>

  <% if (products.length === 0) { %>
    <p class="empty-msg">no products yet!</p>
  <% } else { %>
    <div class="products-grid">
      <% products.forEach(function(product) { %>
        <div class="product-card">
          <% if (product._img) { %>
            <img src="<%= product._img %>" alt="<%= product.name %>">
          <% } else { %>
            <div class="no-img">no image</div>
          <% } %>
          <div class="product-info">
            <p class="product-name"><%= product.name || 'item' %></p>
            <% if (product._displayPrice) { %><p class="product-price"><%= product._displayPrice %></p><% } %>
            <% if (product.description) { %><p class="product-desc"><%= product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description %></p><% } %>

            <div class="product-links">
              <a href="/products/<%= product._slug %>.html" class="product-btn alt">details</a>
              <% if (product._checkoutUrl) { %>
                <a href="<%= product._checkoutUrl %>" target="_blank" rel="noopener noreferrer" class="product-btn">checkout</a>
              <% } %>
            </div>
          </div>
        </div>
      <% }); %>
    </div>
  <% } %>

  <div class="footer"><a href="https://depop.com/satanblowme"><img src="i-98.gif"></a></div>
</body>
</html>
    `;

    const productTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= product.name || 'item' %> — satanblowme shop</title>
  <link href="https://fonts.googleapis.com/css?family=Slabo+27px&display=swap" rel="stylesheet">
  <link href="/style.css" rel="stylesheet" type="text/css" media="all">
  <style>
    html { background: url(/img/230.GIF) repeat; }
    body {
      font-family: 'Slabo 27px', serif;
      color: #fff;
      margin: 0;
      padding: 20px;
    }
    .wrap {
      max-width: 920px;
      margin: 0 auto;
    }
    .back {
      display: inline-block;
      margin-bottom: 16px;
      color: #fff;
      text-decoration: underline;
    }
    .panel {
      background: rgba(255, 255, 255, 0.92);
      color: #222;
      border-radius: 10px;
      box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .hero {
      width: 100%;
      max-height: 520px;
      object-fit: cover;
      display: block;
      background: #ddd;
    }
    .no-img {
      width: 100%;
      height: 320px;
      background: #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    .content {
      padding: 18px 20px 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 2rem;
      color: #111;
    }
    .price {
      color: #cc3333;
      font-size: 1.3rem;
      font-weight: bold;
      margin: 0 0 12px;
    }
    .desc {
      color: #444;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .checkout {
      display: inline-block;
      margin-top: 16px;
      background: #111;
      color: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="/store.html">← back to shop</a>

    <div class="panel">
      <% if (product._img) { %>
        <img class="hero" src="<%= product._img %>" alt="<%= product.name %>">
      <% } else { %>
        <div class="no-img">no image</div>
      <% } %>

      <div class="content">
        <h1><%= product.name || 'item' %></h1>
        <% if (product._displayPrice) { %><p class="price"><%= product._displayPrice %></p><% } %>
        <% if (product.description) { %>
          <p class="desc"><%= product.description %></p>
        <% } else { %>
          <p class="desc">no description yet.</p>
        <% } %>

        <% if (product._checkoutUrl) { %>
          <a class="checkout" href="<%= product._checkoutUrl %>" target="_blank" rel="noopener noreferrer">checkout</a>
        <% } %>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Generate store page
    const storeHtml = ejs.render(storeTemplate, { products: productsWithMeta });
    fs.writeFileSync(path.join(outputDir, 'store.html'), storeHtml);

    // Generate individual product pages
    for (const product of productsWithMeta) {
      const productHtml = ejs.render(productTemplate, { product });
      fs.writeFileSync(path.join(productsOutputDir, `${product._slug}.html`), productHtml);
    }

    console.log(`✅ Generated store.html with ${productsWithMeta.length} products`);
    console.log(`✅ Generated ${productsWithMeta.length} individual product pages in /public/products`);

    const examples = productsWithMeta.slice(0, 3).map((p) => `/products/${p._slug}.html`);
    if (examples.length) {
      console.log('Examples:');
      examples.forEach((url) => console.log(`   ${url}`));
    }
  } catch (error) {
    console.error('❌ Error generating site:', error.message);
    process.exit(1);
  }
}

generateSite();
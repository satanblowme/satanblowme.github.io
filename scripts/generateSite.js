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

function getProductImages(product) {
  const imgs = [];

  if (product.site_image_url) imgs.push(product.site_image_url);
  if (product.thumbnail_url) imgs.push(product.thumbnail_url);
  if (product.image_url) imgs.push(product.image_url);

  if (Array.isArray(product.images)) {
    for (const im of product.images) {
      const u = im?.url || im?.original_url || im?.styles?.large || im?.styles?.product;
      if (u) imgs.push(u);
    }
  }

  return [...new Set(imgs)].filter(Boolean);
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
      products = parsed.data || parsed;
    }

    const outputDir = path.join(__dirname, '../public');
    const productsDir = path.join(outputDir, 'products');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true });

    const used = new Set();
    const productsWithMeta = products.map((p, i) => {
      const base = slugify(p.slug || p.name || p.id || `product-${i + 1}`) || `product-${i + 1}`;
      let slug = base, n = 2;
      while (used.has(slug)) slug = `${base}-${n++}`;
      used.add(slug);

      return {
        ...p,
        _slug: slug,
        _images: getProductImages(p),
        _displayPrice: getDisplayPrice(p),
        _checkoutUrl:
          p.checkout_url ||
          p.checkoutUrl ||
          p.square_checkout_url ||
          p.payment_link_url ||
          ''
      };
    });

    // STORE LIST
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
    html { background: url(img/230.GIF) repeat; }
    .shop-heading { font-family:'Slabo 27px', serif; color:#fff; text-align:center; font-size:1.4em; margin:20px 0 10px; letter-spacing:.05em; }
    .products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; padding:20px; max-width:1000px; margin:0 auto; }
    .product-card { background:rgba(255,255,255,.92); border-radius:8px; box-shadow:2px 3px 8px rgba(0,0,0,.3); overflow:hidden; font-family:'Slabo 27px', serif; }
    .product-card img { width:100%; height:220px; object-fit:cover; display:block; }
    .no-img { width:100%; height:220px; background:#ddd; display:flex; align-items:center; justify-content:center; color:#999; font-size:.85em; }
    .product-info { padding:10px 12px 14px; }
    .product-name { font-size:1em; font-weight:bold; margin:0 0 6px; color:#222; }
    .product-price { color:#cc3333; font-size:1.1em; font-weight:bold; margin:0; }
    .product-desc { font-size:.8em; color:#666; margin:6px 0 0; line-height:1.4; }
    .btns { margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; }
    .btn { display:inline-block; background:#111; color:#fff; padding:8px 12px; border-radius:6px; text-decoration:none; font-size:.85em; }
    .btn.alt { background:#444; }
    .empty-msg { text-align:center; color:#fff; font-family:'Slabo 27px', serif; margin-top:40px; }
  </style>
</head>
<body>
  <div class="satanblowme"><img src="img/satanblowme.gif"></div><br>
  <div class="header">
    <a href="index.html"><img src="img/about_us.gif" style="width:auto;max-height:30px;"></a>
    <a href="cursed_imgs.html"><img src="img/art.gif" style="width:auto;max-height:70px;"></a>
    <a href="collections.html"><img src="img/collections.gif" width="280" height="40" style="object-fit:cover;"></a>
  </div><br>

  <p class="shop-heading">shop</p>

  <% if (products.length === 0) { %>
    <p class="empty-msg">no products yet!</p>
  <% } else { %>
    <div class="products-grid">
      <% products.forEach(function(product) { %>
        <div class="product-card">
          <% if (product._images[0]) { %>
            <img src="<%= product._images[0] %>" alt="<%= product.name %>">
          <% } else { %>
            <div class="no-img">no image</div>
          <% } %>
          <div class="product-info">
            <p class="product-name"><%= product.name || 'item' %></p>
            <% if (product._displayPrice) { %><p class="product-price"><%= product._displayPrice %></p><% } %>
            <% if (product.description) { %><p class="product-desc"><%= product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description %></p><% } %>
            <div class="btns">
              <a class="btn alt" href="/products/<%= product._slug %>.html">details</a>
              <% if (product._checkoutUrl) { %>
                <a class="btn" href="<%= product._checkoutUrl %>" target="_blank" rel="noopener noreferrer">checkout</a>
              <% } %>
            </div>
          </div>
        </div>
      <% }); %>
    </div>
  <% } %>

  <div class="footer"><a href="https://depop.com/satanblowme"><img src="i-98.gif"></a></div>
</body>
</html>`;

    // PRODUCT PAGE + GALLERY
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
    html { background:url(/img/230.GIF) repeat; }
    body { font-family:'Slabo 27px', serif; color:#fff; margin:0; padding:20px; }
    .wrap { max-width:960px; margin:0 auto; }
    .back { display:inline-block; margin-bottom:12px; color:#fff; text-decoration:underline; }
    .panel { background:rgba(255,255,255,.92); color:#222; border-radius:10px; box-shadow:2px 3px 8px rgba(0,0,0,.3); overflow:hidden; }
    .content { padding:18px 20px 24px; }
    h1 { margin:0 0 8px; font-size:2rem; color:#111; }
    .price { color:#cc3333; font-size:1.3rem; font-weight:bold; margin:0 0 12px; }
    .desc { color:#444; line-height:1.6; white-space:pre-wrap; }
    .checkout { display:inline-block; margin-top:16px; background:#111; color:#fff; padding:10px 14px; border-radius:6px; text-decoration:none; font-size:.95em; }

    .main-image-wrap { background:#eee; display:flex; align-items:center; justify-content:center; max-height:520px; overflow:hidden; }
    .main-image { width:100%; max-height:520px; object-fit:contain; display:block; background:#ddd; }
    .thumb-row { display:flex; gap:8px; padding:10px 12px; flex-wrap:wrap; background:#f2f2f2; border-top:1px solid #ddd; }
    .thumb-btn { border:2px solid transparent; border-radius:6px; padding:0; background:none; cursor:pointer; }
    .thumb-btn.active { border-color:#111; }
    .thumb { width:72px; height:72px; object-fit:cover; display:block; border-radius:4px; background:#ddd; }
    .no-img { width:100%; height:300px; display:flex; align-items:center; justify-content:center; color:#999; background:#ddd; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="/store.html">← back to shop</a>
    <div class="panel">
      <% if (product._images.length) { %>
        <div class="main-image-wrap">
          <img id="mainImage" class="main-image" src="<%= product._images[0] %>" alt="<%= product.name %>">
        </div>
        <% if (product._images.length > 1) { %>
          <div class="thumb-row">
            <% product._images.forEach(function(img, idx) { %>
              <button class="thumb-btn <%= idx === 0 ? 'active' : '' %>" data-img="<%= img %>" type="button">
                <img class="thumb" src="<%= img %>" alt="<%= product.name %> thumbnail <%= idx + 1 %>">
              </button>
            <% }); %>
          </div>
        <% } %>
      <% } else { %>
        <div class="no-img">no image</div>
      <% } %>

      <div class="content">
        <h1><%= product.name || 'item' %></h1>
        <% if (product._displayPrice) { %><p class="price"><%= product._displayPrice %></p><% } %>
        <p class="desc"><%= product.description || 'no description yet.' %></p>
        <% if (product._checkoutUrl) { %>
          <a class="checkout" href="<%= product._checkoutUrl %>" target="_blank" rel="noopener noreferrer">checkout</a>
        <% } %>
      </div>
    </div>
  </div>

  <script>
    (function() {
      const main = document.getElementById('mainImage');
      const btns = document.querySelectorAll('.thumb-btn');
      if (!main || !btns.length) return;
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          main.src = btn.getAttribute('data-img');
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    })();
  </script>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'store.html'), ejs.render(storeTemplate, { products: productsWithMeta }));

    for (const product of productsWithMeta) {
      const html = ejs.render(productTemplate, { product });
      fs.writeFileSync(path.join(productsDir, `${product._slug}.html`), html);
    }

    console.log(`✅ Generated store.html with ${productsWithMeta.length} products`);
    console.log(`✅ Generated ${productsWithMeta.length} product pages in /public/products`);
  } catch (error) {
    console.error('❌ Error generating site:', error.message);
    process.exit(1);
  }
}

generateSite();
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

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
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const template = `
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
          <% if (product.thumbnail_url && !product.thumbnail_url.includes('localhost')) { %>
            <img src="<%= product.thumbnail_url %>" alt="<%= product.name %>">
          <% } else { %>
            <div class="no-img">no image</div>
          <% } %>
          <div class="product-info">
            <p class="product-name"><%= product.name || 'item' %></p>
            <% if (product.price) { %><p class="product-price"><%= product.price.display_amount %></p><% } %>
            <% if (product.description) { %><p class="product-desc"><%= product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description %></p><% } %>
          </div>
        </div>
      <% }); %>
    </div>
  <% } %>

  <div class="footer"><a href="https://depop.com/satanblowme"><img src="i-98.gif"></a></div>
</body>
</html>
    `;

    const html = ejs.render(template, { products });
    fs.writeFileSync(path.join(outputDir, 'store.html'), html);

    console.log(`✅ Generated store.html with ${products.length} products`);
  } catch (error) {
    console.error('❌ Error generating site:', error.message);
    process.exit(1);
  }
}

generateSite();

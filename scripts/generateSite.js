const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

async function generateSite() {
  try {
    console.log('Generating static site...');

    const dataPath = path.join(__dirname, '../data/products.json');
    let products = [];
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      products = JSON.parse(data);
    }

    const outputDir = path.join(__dirname, '../public');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Store</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    .products {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .product {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .product h3 {
      margin-top: 0;
      color: #333;
    }
    .product p {
      color: #666;
      margin: 10px 0;
    }
    .price {
      font-weight: bold;
      color: #27ae60;
      font-size: 1.2em;
    }
  </style>
</head>
<body>
  <h1>Store</h1>
  <div class="products">
    <% products.forEach(product => { %>
      <div class="product">
        <h3><%= product.attributes?.name || product.name || 'Product' %></h3>
        <p><%= (product.attributes?.description || product.description || '').substring(0, 100) %>...</p>
        <div class="price">
          $<%= product.attributes?.price || product.price || '0.00' %>
        </div>
      </div>
    <% }); %>
  </div>
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

/**
 * Generate Open Graph HTML tags for social media sharing
 */
const generateOGTags = (product, imageUrl) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://mysource.ng';
  const productUrl = `${baseUrl}/products/${product.id}`;
  
  // Get the first image if available
  const ogImage = imageUrl || `${baseUrl}/default-product.png`;
  
  // Clean description for meta tags (remove extra newlines, limit length)
  const cleanDescription = (product.description || '')
    .replace(/\n+/g, ' ')
    .substring(0, 160);
  
  const title = `${product.description?.split('\n')[0] || 'Product'} - Campus Marketplace`;
  
  const tags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${cleanDescription}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Campus Marketplace" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${cleanDescription}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    <meta name="description" content="${cleanDescription}" />
  `;
  
  return tags;
};

/**
 * Generate a complete HTML page with OG tags
 */
const generatePreviewHTML = (product, imageUrl) => {
  const ogTags = generateOGTags(product, imageUrl);
  const baseUrl = process.env.FRONTEND_URL || 'https://mysource.ng';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.description?.split('\n')[0] || 'Product'} - Campus Marketplace</title>
    ${ogTags}
    <link rel="icon" href="${baseUrl}/favicon.ico" />
    <script>
      // Auto-redirect to the actual product page after 1 second
      setTimeout(() => {
        window.location.href = '${baseUrl}/products/${product.id}';
      }, 1000);
    </script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #f5f5f5;
      }
      .loader {
        text-align: center;
      }
      h1 {
        color: #333;
        margin-bottom: 10px;
      }
      p {
        color: #666;
        font-size: 16px;
      }
    </style>
</head>
<body>
    <div class="loader">
        <h1>Loading product...</h1>
        <p>Redirecting to Campus Marketplace</p>
    </div>
</body>
</html>`;
};

module.exports = {
  generateOGTags,
  generatePreviewHTML,
};





const processProductImages = (product, req) => {
  if (!product) return product;

  let processedImages = [];
  
  if (product.images && product.images.length > 0) {
    processedImages = product.images.map(img => {
      if (img.startsWith('http')) {
        return img;
      } else {
        return `${req.protocol}://${req.get('host')}${img.startsWith('/') ? img : '/' + img}`;
      }
    });
  } else {
    processedImages = [`${req.protocol}:
  }

  return {
    ...product,
    images: processedImages
  };
};

const processProductsArray = (products, req) => {
  if (!Array.isArray(products)) return products;
  
  return products.map(product => processProductImages(product, req));
};

module.exports = {
  processProductImages,
  processProductsArray
};
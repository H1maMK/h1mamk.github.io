/**
 * Обработка изображений товаров
 * Преобразует относительные пути в полные URL
 */

const processProductImages = (product, req) => {
  if (!product) return product;

  let processedImages = [];
  
  if (product.images && product.images.length > 0) {
    processedImages = product.images.map(img => {
      if (img.startsWith('http')) {
        return img; // Уже полный URL (Cloudinary)
      } else {
        return `${req.protocol}://${req.get('host')}${img.startsWith('/') ? img : '/' + img}`;
      }
    });
  } else {
    processedImages = [`${req.protocol}://${req.get('host')}/uploads/default-product.png`];
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
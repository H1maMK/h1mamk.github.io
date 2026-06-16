const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');


const syncImages = async (req, res) => {
  try {
    const { imageUrl, productId } = req.body;
    
    if (!imageUrl || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and product ID are required'
      });
    }


    if (imageUrl.includes(req.get('host'))) {
      return res.json({
        success: true,
        message: 'Image is already local',
        localUrl: imageUrl
      });
    }


    const fileName = `synced-${productId}-${Date.now()}.jpg`;
    const localPath = path.join(__dirname, '../uploads/products', fileName);
    

    const uploadsDir = path.dirname(localPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }


    const client = imageUrl.startsWith('https') ? https : http;
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(localPath);
      
      client.get(imageUrl, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const localUrl = `${req.protocol}://${req.get('host')}/uploads/products/${fileName}`;
          
          res.json({
            success: true,
            message: 'Image synced successfully',
            localUrl: localUrl,
            originalUrl: imageUrl
          });
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(localPath, () => {}); // Удаляем файл при ошибке
        res.status(500).json({
          success: false,
          message: 'Failed to download image',
          error: err.message
        });
        reject(err);
      });
    });

  } catch (error) {
    console.error('Sync images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync images',
      error: error.message
    });
  }
};

// @route   POST /api/sync/images
// @desc    Sync images from external URLs to local storage
// @access  Public
router.post('/images', syncImages);

module.exports = router;
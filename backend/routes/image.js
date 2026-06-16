const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const fallbackImageByType = {
  avatars: path.join(__dirname, '..', 'uploads', 'avatars', 'default.svg'),
  products: path.join(__dirname, '..', 'uploads', 'products', 'default.svg'),
  articles: path.join(__dirname, '..', 'uploads', 'articles', 'default.svg')
};


router.get('/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  

  const allowedTypes = ['avatars', 'products', 'articles'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid image type' });
  }
  

  const filePath = path.join(__dirname, '..', 'uploads', type, filename);
  

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  

  if (!fs.existsSync(filePath)) {
    const fallbackPath = fallbackImageByType[type];
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      return res.sendFile(fallbackPath);
    }

    return res.status(404).json({ error: 'Image not found' });
  }
  

  res.sendFile(filePath);
});

module.exports = router;

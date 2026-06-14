const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// @route   GET /api/image/:type/:filename
// @desc    Serve images with proper CORS headers
// @access  Public
router.get('/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  
  // Validate type
  const allowedTypes = ['avatars', 'products', 'articles'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid image type' });
  }
  
  // Construct file path
  const filePath = path.join(__dirname, '..', 'uploads', type, filename);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // For missing avatars return default placeholder instead of 404
  if (!fs.existsSync(filePath)) {
    if (type === 'avatars') {
      const defaultAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', 'default.svg');
      if (fs.existsSync(defaultAvatarPath)) {
        return res.sendFile(defaultAvatarPath);
      }
    }

    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Serve the file
  res.sendFile(filePath);
});

module.exports = router;
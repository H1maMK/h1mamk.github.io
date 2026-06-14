const express = require('express');
const router = express.Router();

// Import controllers
const {
  getArticles,
  getArticle
} = require('../controllers/articleController');

// @route   GET /api/articles
// @desc    Get all articles
// @access  Public
router.get('/', getArticles);

// @route   GET /api/articles/:id
// @desc    Get specific article
// @access  Public
router.get('/:id', getArticle);

module.exports = router;
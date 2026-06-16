const express = require('express');
const router = express.Router();


const {
  getArticles,
  getArticle
} = require('../controllers/articleController');


router.get('/', getArticles);


router.get('/:id', getArticle);

module.exports = router;
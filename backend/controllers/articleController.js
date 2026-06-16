const Article = require('../models/Article')
const { success, error, notFound, validationError } = require('../utils/response')
const fs = require('fs')
const path = require('path')
const { MAX_IMAGE_FILE_SIZE } = require('../middleware/upload')

const parseJsonValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  try {
    return JSON.parse(value)
  } catch (parseError) {
    console.warn('Failed to parse article payload:', parseError.message)
    return undefined
  }
}

const parseBooleanValue = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    return value === 'true'
  }

  return Boolean(value)
}

const parseStringArray = (value, fallback = []) => {
  const parsed = parseJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed.map((item) => `${item}`.trim()).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n+/)
      .map((item) => item.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
  }

  return fallback
}

const parseSections = (value, fallback = []) => {
  const parsed = parseJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed
      .map((section) => ({
        title: `${section?.title || ''}`.trim(),
        points: parseStringArray(section?.points, []),
      }))
      .filter((section) => section.title || section.points.length > 0)
  }

  return fallback
}

const parseLinks = (value, fallback = []) => {
  const parsed = parseJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed
      .map((link) => ({
        label: `${link?.label || ''}`.trim(),
        to: `${link?.to || ''}`.trim(),
      }))
      .filter((link) => link.label && link.to)
  }

  return fallback
}

const parsePresentation = (reqBody = {}) => {
  const payload = parseJsonValue(reqBody.presentation) || {}

  const badge = reqBody.badge ?? payload.badge
  const icon = reqBody.icon ?? payload.icon
  const summary = reqBody.summary ?? payload.summary
  const theme = reqBody.theme ?? payload.theme
  const takeaways = reqBody.takeaways ?? payload.takeaways
  const sections = reqBody.sections ?? payload.sections
  const highlights = reqBody.highlights ?? payload.highlights
  const links = reqBody.links ?? payload.links

  const presentation = {}

  if (badge !== undefined) presentation.badge = `${badge}`.trim()
  if (icon !== undefined) presentation.icon = `${icon}`.trim()
  if (summary !== undefined) presentation.summary = `${summary}`.trim()
  if (theme !== undefined) presentation.theme = `${theme}`.trim()
  if (takeaways !== undefined) presentation.takeaways = parseStringArray(takeaways, [])
  if (sections !== undefined) presentation.sections = parseSections(sections, [])
  if (highlights !== undefined) presentation.highlights = parseStringArray(highlights, [])
  if (links !== undefined) presentation.links = parseLinks(links, [])

  return Object.keys(presentation).length > 0 ? presentation : undefined
}

const removeFileIfExists = async (filePath) => {
  if (!filePath) return

  try {
    await fs.promises.unlink(filePath)
  } catch (unlinkError) {
    if (unlinkError.code !== 'ENOENT') {
      console.warn('Failed to delete article image:', unlinkError.message)
    }
  }
}

const resolveLocalArticleFilePath = (storedPath = '') => {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) {
    return ''
  }

  return path.join(__dirname, '..', storedPath.replace(/^\/+/, ''))
}

const buildArticleData = (req) => {
  const { title, content, isPublished, removeImage } = req.body
  const articleData = {
    title: `${title || ''}`.trim(),
    content: `${content || ''}`,
    isPublished: parseBooleanValue(isPublished, true),
    publishedAt: new Date(),
  }

  const presentation = parsePresentation(req.body)
  if (presentation) {
    articleData.presentation = presentation
  }

  if (req.file) {
    articleData.imageUrl = typeof req.file.path === 'string' && /^https?:\/\//i.test(req.file.path)
      ? req.file.path
      : (typeof req.file.secure_url === 'string' && /^https?:\/\//i.test(req.file.secure_url)
          ? req.file.secure_url
          : `/uploads/articles/${req.file.filename}`)
  } else if (parseBooleanValue(removeImage, false)) {
    articleData.imageUrl = ''
  }

  return articleData
}

// Получение всех статей (только опубликованные для публичного доступа)
const getArticles = async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300')

    const { page = 1, limit = 10, search, includeUnpublished } = req.query

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const filter = {}

    if (includeUnpublished !== 'true') {
      filter.isPublished = true
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]
    }

    const [articles, totalCount] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('title content imageUrl publishedAt presentation createdAt updatedAt mysqlId')
        .lean(),
      Article.countDocuments(filter),
    ])

    const pages = Math.ceil(totalCount / limitNum)

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages,
      hasNext: pageNum < pages,
      hasPrev: pageNum > 1,
    }

    return success(res, { articles, pagination }, 'Articles retrieved successfully')
  } catch (err) {
    console.error('Get articles error:', err)
    return error(
      res,
      'Failed to get articles',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

const getArticle = async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=120, s-maxage=600')

    const { id } = req.params

    const article = await Article.findById(id).lean()

    if (!article) {
      return notFound(res, 'Article not found')
    }

    if (!article.isPublished) {
      return notFound(res, 'Article not found')
    }

    return success(res, { article }, 'Article retrieved successfully')
  } catch (err) {
    console.error('Get article error:', err)

    if (err.name === 'CastError') {
      return notFound(res, 'Article not found')
    }

    return error(
      res,
      'Failed to get article',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

// Получение конкретной статьи для админки (включая черновики)
const getArticleForAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id).lean()

    if (!article) {
      return notFound(res, 'Article not found')
    }

    return success(res, { article }, 'Article retrieved successfully')
  } catch (err) {
    console.error('Get admin article error:', err)

    if (err.name === 'CastError') {
      return notFound(res, 'Article not found')
    }

    return error(
      res,
      'Failed to get article',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

// Создание статьи (Admin)
const createArticle = async (req, res) => {
  try {
    if (req.uploadError) {
      return error(
        res,
        req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : (req.uploadError.message || 'Ошибка загрузки изображения'),
        400
      )
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'articles')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const { title, content } = req.body
    const isPublished = parseBooleanValue(req.body.isPublished, true)
    const presentation = parsePresentation(req.body)

    if (!title || !`${title}`.trim()) {
      return validationError(res, [{ field: 'title', message: 'Title is required' }])
    }

    if (!content || !`${content}`.trim()) {
      return validationError(res, [{ field: 'content', message: 'Content is required' }])
    }

    const articleData = {
      title: `${title}`.trim(),
      content: `${content}`,
      isPublished,
      publishedAt: new Date(),
    }

    if (presentation) {
      articleData.presentation = presentation
    }

    if (req.file) {
      articleData.imageUrl = typeof req.file.path === 'string' && /^https?:\/\//i.test(req.file.path)
        ? req.file.path
        : (typeof req.file.secure_url === 'string' && /^https?:\/\//i.test(req.file.secure_url)
            ? req.file.secure_url
            : `/uploads/articles/${req.file.filename}`)
    }

    const article = new Article(articleData)
    await article.save()

    return success(res, { article }, 'Article created successfully', 201)
  } catch (err) {
    console.error('=== CREATE ARTICLE ERROR ===')
    console.error('Error name:', err.name)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack)

    if (err.errors) {
      console.error('Validation errors:', err.errors)
    }

    return error(
      res,
      'Failed to create article',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

// Обновление статьи (Admin)
const updateArticle = async (req, res) => {
  try {
    if (req.uploadError) {
      return error(
        res,
        req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : (req.uploadError.message || 'Ошибка загрузки изображения'),
        400
      )
    }

    const { id } = req.params
    const article = await Article.findById(id)

    if (!article) {
      return notFound(res, 'Article not found')
    }

    const previousImageUrl = article.imageUrl || ''
    const shouldRemoveImage = parseBooleanValue(req.body.removeImage, false)
    const title = req.body.title
    const content = req.body.content
    const isPublished = req.body.isPublished
    const presentation = parsePresentation(req.body)

    if (title !== undefined) article.title = `${title}`.trim()
    if (content !== undefined) article.content = `${content}`
    if (isPublished !== undefined) {
      article.isPublished = parseBooleanValue(isPublished, article.isPublished)
    }
    if (presentation) {
      article.presentation = {
        ...(article.presentation?.toObject ? article.presentation.toObject() : article.presentation || {}),
        ...presentation,
      }
    }

    if (req.file) {
      const nextImageUrl = typeof req.file.path === 'string' && /^https?:\/\//i.test(req.file.path)
        ? req.file.path
        : (typeof req.file.secure_url === 'string' && /^https?:\/\//i.test(req.file.secure_url)
            ? req.file.secure_url
            : `/uploads/articles/${req.file.filename}`)

      if (previousImageUrl && previousImageUrl !== nextImageUrl && !/^https?:\/\//i.test(previousImageUrl)) {
        const oldImagePath = resolveLocalArticleFilePath(previousImageUrl)
        await removeFileIfExists(oldImagePath)
      }

      article.imageUrl = nextImageUrl
    } else if (shouldRemoveImage) {
      if (previousImageUrl && !/^https?:\/\//i.test(previousImageUrl)) {
        const oldImagePath = resolveLocalArticleFilePath(previousImageUrl)
        await removeFileIfExists(oldImagePath)
      }

      article.imageUrl = ''
    }

    await article.save()

    return success(res, { article }, 'Article updated successfully')
  } catch (err) {
    console.error('Update article error:', err)

    if (err.name === 'CastError') {
      return notFound(res, 'Article not found')
    }

    return error(
      res,
      'Failed to update article',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

// Удаление статьи (Admin)
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findByIdAndDelete(id)
    if (!article) {
      return notFound(res, 'Article not found')
    }

    if (article.imageUrl && !/^https?:\/\//i.test(article.imageUrl)) {
      const imagePath = resolveLocalArticleFilePath(article.imageUrl)
      await removeFileIfExists(imagePath)
    }

    return success(res, null, 'Article deleted successfully')
  } catch (err) {
    console.error('Delete article error:', err)

    if (err.name === 'CastError') {
      return notFound(res, 'Article not found')
    }

    return error(
      res,
      'Failed to delete article',
      500,
      process.env.NODE_ENV !== 'production' ? err.message : undefined
    )
  }
}

module.exports = {
  getArticles,
  getArticle,
  getArticleForAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
}

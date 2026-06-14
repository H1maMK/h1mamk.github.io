import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import RichEditor from '../../components/RichEditor'
import { buildApiUrl, API_ENDPOINTS } from '../../config/api'
import './ArticleEditor.css'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

const isAllowedImageFile = (file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase()
  return Boolean(file && ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension))
}

const ARTICLE_TEMPLATES = [
  {
    id: 'blank',
    title: 'Пустой шаблон',
    description: 'Чистый лист для новой статьи.',
    badge: '',
    articleTitle: '',
    content: '<p></p>',
  },
  {
    id: 'mouse-fps',
    title: 'FPS-гайд по мыши',
    description: 'Структура для статьи о выборе мыши для шутеров.',
    badge: 'FPS-гайд',
    articleTitle: 'Как выбрать игровую мышь для FPS-игр: советы и рекомендации',
    content:
      '<p>Разбираем форму, вес, сенсор и беспроводные решения — всё, что помогает выбрать мышь без ошибок.</p><h2>Форма и хват</h2><ul><li>Palm grip подходит для спокойного контроля.</li><li>Claw grip лучше для компактных моделей.</li><li>Fingertip grip требует лёгкой мыши.</li></ul><h2>Вес и сенсор</h2><ul><li>45–70 г — лучший диапазон для быстрых FPS.</li><li>Стабильный сенсор важнее цифры DPI.</li><li>1000 Гц достаточно большинству игроков.</li></ul><h2>Вывод</h2><p>Главный критерий — удобство в руке.</p>',
  },
  {
    id: 'keyboard-review',
    title: 'Обзор механических клавиатур',
    description: 'Шаблон для статьи про переключатели и формат.',
    badge: 'Клавиатурный обзор',
    articleTitle: 'Топ-5 механических клавиатур для геймеров: что выбрать?',
    content:
      '<p>Разбираем переключатели, форматы и дополнительные функции, которые реально влияют на комфорт.</p><h2>Свитчи</h2><ul><li>Linear — быстрые и плавные.</li><li>Tactile — универсальный вариант.</li><li>Clicky — хорошо для печати.</li></ul><h2>Формат</h2><ul><li>100% удобен для работы.</li><li>TKL — самый практичный компромисс.</li><li>60–75% дают больше места под мышь.</li></ul><h2>Итог</h2><p>Для универсального сценария подойдёт TKL с тактильными свитчами.</p>',
  },
  {
    id: 'mouse-top',
    title: 'Топ мышек для геймеров',
    description: 'Шаблон под обзор популярных моделей.',
    badge: 'Топ-5 мышек',
    articleTitle: 'Топ-5 мышек для геймеров: что выбрать?',
    content:
      '<p>Собрали популярные модели с акцентом на вес, сенсор, форму корпуса и сценарии использования.</p><h2>На что смотреть</h2><ul><li>Вес и форма корпуса напрямую влияют на комфорт.</li><li>Сенсор должен быть стабильным, без срывов.</li><li>Частота опроса важна, но не заменяет удобство хвата.</li></ul><h2>Итог</h2><p>Лучший выбор зависит от хвата и жанра игр.</p>',
  },
]

const ARTICLE_TEMPLATE_MAP = ARTICLE_TEMPLATES.reduce((acc, t) => {
  acc[t.id] = t
  return acc
}, {})

const ArticleEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const coverInputRef = useRef(null)

  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [articleId, setArticleId] = useState(id || null)
  const [title, setTitle] = useState('')
  const [badge, setBadge] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [existingCoverUrl, setExistingCoverUrl] = useState('')
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(ARTICLE_TEMPLATES[0].id)

  useEffect(() => {
    if (!id) {
      const t = ARTICLE_TEMPLATES[0]
      setArticleId(null)
      setTitle(t.articleTitle)
      setBadge(t.badge)
      setContent(t.content)
      setIsPublished(true)
      setExistingCoverUrl('')
      setCoverPreview('')
      setCoverImage(null)
      setCoverRemoved(false)
      setLoading(false)
      return
    }

    const loadArticle = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN_ARTICLES}/${id}`), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        const data = await response.json().catch(() => null)

        if (!response.ok || !data?.success) {
          throw new Error(data?.error?.message || data?.message || `HTTP ${response.status}`)
        }

        const article = data.data?.article || data.data

        setArticleId(article._id || id)
        setTitle(article.title || '')
        setBadge(article.presentation?.badge || '')
        setContent(article.content || '')
        setIsPublished(article.isPublished ?? true)
        setExistingCoverUrl(
          article.imageUrl
            ? `${article.imageUrl.startsWith('http') ? '' : 'http://localhost:3002/'}${article.imageUrl.replace(/^\//, '')}`
            : '',
        )
        setCoverPreview('')
        setCoverImage(null)
        setCoverRemoved(false)
      } catch (loadError) {
        console.error('Error loading article:', loadError)
        setError(loadError.message || 'Ошибка загрузки статьи')
        toast.error('Ошибка загрузки статьи')
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [id])

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAllowedImageFile(file)) {
      toast.error('Можно загрузить только изображение: JPG, PNG или WEBP')
      event.target.value = ''
      return
    }

    setCoverImage(file)
    setCoverRemoved(false)
    setExistingCoverUrl('')

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setCoverPreview(loadEvent.target?.result || '')
    }
    reader.readAsDataURL(file)
  }

  const openCoverPicker = () => {
    coverInputRef.current?.click()
  }

  const replaceCover = () => {
    openCoverPicker()
  }

  const removeCover = () => {
    setCoverImage(null)
    setCoverPreview('')
    setExistingCoverUrl('')
    setCoverRemoved(true)
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const applyTemplate = (templateId) => {
    const template = ARTICLE_TEMPLATE_MAP[templateId] || ARTICLE_TEMPLATES[0]

    const hasExistingContent = content.replace(/<[^>]*>/g, '').trim().length > 0 || title.trim()
    if (hasExistingContent && templateId !== 'blank') {
      const shouldReplace = window.confirm('Текущий текст будет заменён шаблоном. Продолжить?')
      if (!shouldReplace) return
    }

    setSelectedTemplate(template.id)
    setTitle(template.articleTitle)
    setBadge(template.badge)
    setContent(template.content)
    toast.success(`Шаблон «${template.title}» применён`)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Введите заголовок')
      return
    }

    if (!content.replace(/<[^>]*>/g, '').trim()) {
      toast.error('Введите содержание статьи')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('content', content)
      formData.append('isPublished', String(isPublished))

      const presentationData = {
        badge: badge.trim(),
      }
      formData.append('presentation', JSON.stringify(presentationData))
      formData.append('removeImage', String(coverRemoved && !coverImage))

      if (coverImage) {
        formData.append('image', coverImage)
      }

      const url = articleId
        ? buildApiUrl(`${API_ENDPOINTS.ADMIN_ARTICLES}/${articleId}`)
        : buildApiUrl(API_ENDPOINTS.ADMIN_ARTICLES)

      const response = await fetch(url, {
        method: articleId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Ошибка сохранения статьи')
      }

      toast.success(articleId ? 'Статья обновлена' : 'Статья создана')
      navigate('/admin/articles')
    } catch (saveError) {
      console.error('Error saving article:', saveError)
      toast.error(saveError.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="article-editor-page">
        <div className="article-editor-loading">Загрузка статьи...</div>
      </div>
    )
  }

  const previewImageUrl = coverPreview || existingCoverUrl || ''

  return (
    <div className="article-editor-page">
      <header className="article-editor-topbar">
        <div className="article-editor-topbar-group">
          <button className="article-editor-back" onClick={() => navigate('/admin/articles')}>
            ← Назад
          </button>
        </div>

        <div className="article-editor-actions">
          <label className="article-editor-status">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
            />
            <span>{isPublished ? 'Опубликована' : 'Черновик'}</span>
          </label>

          <button className="article-editor-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : articleId ? 'Сохранить статью' : 'Создать статью'}
          </button>
        </div>
      </header>

      <main className="article-editor-layout">
        <section className="article-editor-main-column">
          <article className="article-editor-card">
            <div className="article-editor-card-head">
              <h2>Основные поля</h2>
              <p>Заголовок, тег категории и содержимое статьи.</p>
            </div>

            {error ? <div className="article-editor-error">{error}</div> : null}

            <div className="article-editor-field">
              <label htmlFor="article-title">Заголовок</label>
              <input
                id="article-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Как выбрать игровую мышь для FPS-игр"
              />
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-badge">Тег категории</label>
              <input
                id="article-badge"
                type="text"
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                placeholder="FPS-гайд, Клавиатурный обзор, Топ-5 мышек, Гайд..."
              />
            </div>

            <div className="article-editor-field">
              <label>Содержание</label>
              <RichEditor value={content} onChange={setContent} />
            </div>
          </article>

          <article className="article-editor-card">
            <div className="article-editor-card-head">
              <h2>Готовые шаблоны</h2>
              <p>Выбери шаблон — заголовок, тег и содержание заполнятся автоматически.</p>
            </div>

            <div className="article-template-list">
              {ARTICLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`article-template-item ${selectedTemplate === template.id ? 'active' : ''}`}
                  onClick={() => applyTemplate(template.id)}
                >
                  <span className="article-template-title">{template.title}</span>
                  <span className="article-template-description">{template.description}</span>
                </button>
              ))}
            </div>
          </article>
        </section>

        <aside className="article-editor-sidebar">
          <article className="article-editor-card">
            <div className="article-editor-card-head">
              <h2>Обложка</h2>
              <p>Изображение для карточки статьи.</p>
            </div>

            <div className="cover-manager">
              {previewImageUrl ? (
                <div className="cover-preview-card">
                  <img src={previewImageUrl} alt={title || 'Обложка статьи'} />
                  <div className="cover-preview-actions">
                    <button type="button" className="cover-action" onClick={replaceCover}>
                      Заменить
                    </button>
                    <button type="button" className="cover-action ghost" onClick={removeCover}>
                      Удалить
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="cover-upload-card" onClick={openCoverPicker}>
                  <span className="cover-upload-title">Выбрать обложку</span>
                  <span className="cover-upload-text">PNG, JPG, WEBP</span>
                </button>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="cover-input"
              />
            </div>
          </article>
        </aside>
      </main>
    </div>
  )
}

export default ArticleEditor

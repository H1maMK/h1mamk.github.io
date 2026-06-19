import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { buildAssetUrl } from '../../config/api'
import { buildArticleEditorContent, getArticlePresentation } from '../../utils/articlePresentation'
import { resizeImageFile } from '../../utils/imageCompression'
import api from '../../services/api'
import './ArticleEditor.css'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024

const isAllowedImageFile = (file) => {
  const extension = file?.name?.split('.').pop()?.toLowerCase()
  return Boolean(file && ALLOWED_IMAGE_TYPES.includes(file.type) && ALLOWED_IMAGE_EXTENSIONS.includes(extension))
}

const createEmptySection = () => ({ title: '', points: '' })

const textListToMultiline = (items = []) => items.join('\n')

const multilineToTextList = (value = '') =>
  `${value}`
    .split(/\r?\n+/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean)

const linksToMultiline = (links = []) =>
  links
    .map((link) => `${link.label || ''} | ${link.to || ''}`.trim())
    .filter(Boolean)
    .join('\n')

const multilineToLinks = (value = '') =>
  `${value}`
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, toPart] = line.split('|').map((item) => item?.trim() || '')

      if (!labelPart && !toPart) return null
      if (!toPart) return { label: labelPart, to: labelPart }

      return { label: labelPart, to: toPart }
    })
    .filter((link) => link?.label && link?.to)

const sectionsToEditable = (sections = []) =>
  Array.isArray(sections) && sections.length > 0
    ? sections.map((section) => ({
        title: section?.title || '',
        points: textListToMultiline(section?.points || []),
      }))
    : [createEmptySection()]

const editableSectionsToPayload = (sections = []) =>
  sections
    .map((section) => ({
      title: `${section?.title || ''}`.trim(),
      points: multilineToTextList(section?.points || ''),
    }))
    .filter((section) => section.title || section.points.length > 0)

const createFormState = ({
  title = '',
  badge = '',
  summary = '',
  takeaways = [],
  sections = [],
  highlights = [],
  links = [],
  isPublished = true,
} = {}) => ({
  title,
  badge,
  summary,
  takeaways: textListToMultiline(takeaways),
  sections: sectionsToEditable(sections),
  highlights: textListToMultiline(highlights),
  links: linksToMultiline(links),
  isPublished,
})

const ARTICLE_TEMPLATES = [
  {
    id: 'blank',
    title: 'Пустой шаблон',
    description: 'Чистый лист для новой статьи.',
    badge: '',
    articleTitle: '',
    summary: '',
    takeaways: [],
    sections: [],
    highlights: [],
    links: [],
  },
  {
    id: 'mouse-fps',
    title: 'FPS-гайд по мыши',
    description: 'Структура для статьи о выборе мыши для шутеров.',
    badge: 'FPS-гайд',
    articleTitle: 'Как выбрать игровую мышь для FPS-игр: советы и рекомендации',
    summary: 'Как выбрать лёгкую, точную и удобную мышь для шутеров без переплаты за лишние функции.',
    takeaways: [
      'Лёгкий вес помогает быстрее наводиться.',
      'Современный сенсор важнее завышенного DPI.',
      'Хват и форма решают больше, чем маркетинг.',
    ],
    sections: [
      {
        title: 'Форма и хват',
        points: [
          'Palm grip подходит для спокойного контроля и мышей с высокой спинкой.',
          'Claw grip лучше работает на компактных и более резких моделях.',
          'Fingertip grip требует лёгкой мыши и минимального сопротивления.',
        ],
      },
      {
        title: 'Вес',
        points: [
          '45–70 г — лучший диапазон для быстрых FPS.',
          '70–90 г — универсальный компромисс.',
          'Свыше 90 г — обычно тяжеловато для соревновательных шутеров.',
        ],
      },
      {
        title: 'Сенсор и отклик',
        points: [
          'Смотри на стабильность, а не на цифру DPI.',
          '1000 Гц хватает большинству игроков.',
          '4000–8000 Гц полезны не всем и требуют мощного ПК.',
        ],
      },
      {
        title: 'Вывод',
        points: [
          'Главный критерий — удобство в руке.',
          'Беспроводные модели уже не уступают проводным по задержке.',
          'Для шутеров лучше брать лёгкую и предсказуемую мышь.',
        ],
      },
    ],
    highlights: [
      'Подходит для CS2, Valorant и Apex.',
      'Обрати внимание на форму корпуса и хват.',
      'Беспроводные модели уже не уступают проводным.',
    ],
    links: [
      { label: 'Смотреть все статьи', to: '/articles' },
      { label: 'Перейти к клавиатурам', to: '/articles/2' },
      { label: 'Открыть подборку мышек', to: '/catalog?device_category=Мыши' },
    ],
  },
  {
    id: 'keyboard-review',
    title: 'Обзор механических клавиатур',
    description: 'Шаблон для статьи про переключатели и формат.',
    badge: 'Клавиатурный обзор',
    articleTitle: 'Топ-5 механических клавиатур для геймеров: что выбрать?',
    summary: 'Разбираем переключатели, форматы и функции, которые реально влияют на комфорт и скорость в игре.',
    takeaways: [
      'Линейные свитчи — фаворит для FPS.',
      'TKL и 60% экономят место под мышь.',
      'Hot-swap и VIA/QMK дают больше свободы кастомизации.',
    ],
    sections: [
      {
        title: 'Свитчи',
        points: [
          'Linear — плавные и быстрые, хорошо подходят для шутеров.',
          'Tactile — универсальный вариант для игр и набора текста.',
          'Clicky — хороши для печати, но могут быть шумными.',
        ],
      },
      {
        title: 'Формат',
        points: [
          '100% удобен для работы и стратегий.',
          'TKL — самый практичный компромисс для большинства игроков.',
          '60–75% освобождают больше места для мыши.',
        ],
      },
      {
        title: 'Подключение и функции',
        points: [
          'Провод — самый надёжный вариант без лишних вопросов.',
          'Беспроводной режим важен, если он действительно низколатентный.',
          'Hot-swap, профили и макросы добавляют гибкости.',
        ],
      },
      {
        title: 'Итог',
        points: [
          'Для шутеров лучше линейные переключатели и компактный формат.',
          'Для универсального сценария подойдёт TKL с тактильными свитчами.',
          'Для кастомизации стоит смотреть на hot-swap и поддержку VIA/QMK.',
        ],
      },
    ],
    highlights: [
      'Подойдёт и для игр, и для работы.',
      'Беспроводной режим важен не меньше RGB.',
      'Клавиши и корпус лучше тестировать вживую.',
    ],
    links: [
      { label: 'Смотреть все статьи', to: '/articles' },
      { label: 'Перейти к мышам', to: '/articles/1' },
      { label: 'Открыть каталог клавиатур', to: '/catalog?device_category=Клавиатуры' },
    ],
  },
  {
    id: 'mouse-top',
    title: 'Топ мышек для геймеров',
    description: 'Шаблон под обзор популярных моделей.',
    badge: 'Топ-5 мышек',
    articleTitle: 'Топ-5 мышек для геймеров: что выбрать?',
    summary: 'Подборка популярных моделей с акцентом на вес, сенсор и форму корпуса для разных стилей игры.',
    takeaways: [
      'Для FPS лучше брать самые лёгкие модели.',
      'Быстрый сенсор и низкая задержка важнее цифр на коробке.',
      'Эргономика часто важнее максимального DPI.',
    ],
    sections: [
      {
        title: 'На что смотреть в первую очередь',
        points: [
          'Вес и форма корпуса напрямую влияют на комфорт.',
          'Сенсор должен быть стабильным, без срывов и задержек.',
          'Частота опроса важна, но не заменяет удобство хвата.',
        ],
      },
      {
        title: 'Топовые модели',
        points: [
          'Logitech G Pro X Superlight 2 — универсальный киберспортивный вариант.',
          'Razer Viper V3 Pro — лёгкая и очень быстрая.',
          'Pulsar X2 — хороший баланс цены и характеристик.',
        ],
      },
      {
        title: 'Кому что подойдёт',
        points: [
          'Соревновательным игрокам — максимально лёгкие мыши.',
          'Любителям универсальности — модели среднего веса и удобной формы.',
          'Тем, кто любит тюнинг — модели с продвинутой настройкой.',
        ],
      },
      {
        title: 'Итог',
        points: [
          'Лучший выбор зависит от хвата и жанра игр.',
          'Не переплачивай за лишний DPI.',
          'Удобство важнее маркетинга и цифр на упаковке.',
        ],
      },
    ],
    highlights: [
      'Есть варианты и для киберспорта, и для универсального использования.',
      'Проверь хват перед покупкой.',
      'Обрати внимание на автономность и вес.',
    ],
    links: [
      { label: 'Смотреть все статьи', to: '/articles' },
      { label: 'Перейти к первой статье', to: '/articles/1' },
      { label: 'Открыть каталог мышей', to: '/catalog?device_category=Мыши' },
    ],
  },
]

const ARTICLE_TEMPLATE_MAP = ARTICLE_TEMPLATES.reduce((acc, t) => {
  acc[t.id] = t
  return acc
}, {})

const buildFormFromTemplate = (template) =>
  createFormState({
    title: template.articleTitle,
    badge: template.badge,
    summary: template.summary,
    takeaways: template.takeaways,
    sections: template.sections,
    highlights: template.highlights,
    links: template.links,
    isPublished: true,
  })

const buildFormFromArticle = (article) => {
  const presentation = getArticlePresentation(article)

  return createFormState({
    title: article?.title || '',
    badge: presentation.badge || '',
    summary: presentation.summary || '',
    takeaways: presentation.takeaways || [],
    sections: presentation.sections || [],
    highlights: presentation.highlights || [],
    links: presentation.links || [],
    isPublished: article?.isPublished ?? true,
  })
}

const ArticleEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const coverInputRef = useRef(null)

  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [articleId, setArticleId] = useState(id || null)
  const [form, setForm] = useState(buildFormFromTemplate(ARTICLE_TEMPLATES[0]))
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [existingCoverUrl, setExistingCoverUrl] = useState('')
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(ARTICLE_TEMPLATES[0].id)

  useEffect(() => {
    if (!id) {
      const template = ARTICLE_TEMPLATES[0]
      setArticleId(null)
      setForm(buildFormFromTemplate(template))
      setExistingCoverUrl('')
      setCoverPreview('')
      setCoverImage(null)
      setCoverRemoved(false)
      setSelectedTemplate(template.id)
      setLoading(false)
      return
    }

    const loadArticle = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get(`/admin/articles/${id}`)
        const data = response.data

        if (!data?.success) {
          throw new Error(data?.error?.message || data?.message || 'Ошибка загрузки статьи')
        }

        const article = data.data?.article || data.data

        setArticleId(article._id || id)
        setForm(buildFormFromArticle(article))
        setExistingCoverUrl(article.imageUrl ? buildAssetUrl(article.imageUrl) : '')
        setCoverPreview('')
        setCoverImage(null)
        setCoverRemoved(false)
        setSelectedTemplate('blank')
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

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSectionChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      ),
    }))
  }

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection()],
    }))
  }

  const removeSection = (index) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.length > 1
        ? prev.sections.filter((_, sectionIndex) => sectionIndex !== index)
        : [createEmptySection()],
    }))
  }

  const handleCoverChange = (event) => {
    const applyCoverFile = async () => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!isAllowedImageFile(file)) {
        toast.error('Можно загрузить только изображение: JPG, PNG или WEBP')
        event.target.value = ''
        return
      }

      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast.error('Размер изображения не должен превышать 10 МБ')
        event.target.value = ''
        return
      }

      const optimizedFile = await resizeImageFile(file, {
        maxWidth: 1400,
        maxHeight: 900,
        maxFileSizeBytes: 900 * 1024,
        outputType: 'image/jpeg',
        initialQuality: 0.86,
      })

      setCoverImage(optimizedFile)
      setCoverRemoved(false)
      setExistingCoverUrl('')

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        setCoverPreview(loadEvent.target?.result || '')
      }
      reader.readAsDataURL(optimizedFile)
    }

    applyCoverFile().catch((error) => {
      console.error('Error optimizing article cover:', error)
      toast.error('Не удалось обработать изображение')
      event.target.value = ''
    })
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

    const hasExistingContent =
      form.title.trim() ||
      form.summary.trim() ||
      form.takeaways.trim() ||
      form.highlights.trim() ||
      form.links.trim() ||
      form.sections.some((section) => section.title.trim() || section.points.trim())

    if (hasExistingContent && templateId !== 'blank') {
      const shouldReplace = window.confirm('Текущая структура статьи будет заменена шаблоном. Продолжить?')
      if (!shouldReplace) return
    }

    setSelectedTemplate(template.id)
    setForm(buildFormFromTemplate(template))
    toast.success(`Шаблон «${template.title}» применён`)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Введите заголовок')
      return
    }

    if (!form.summary.trim()) {
      toast.error('Добавьте краткое описание статьи')
      return
    }

    const sectionsPayload = editableSectionsToPayload(form.sections)
    if (sectionsPayload.length === 0) {
      toast.error('Добавьте хотя бы одну секцию статьи')
      return
    }

    setSaving(true)

    try {
      const presentationData = {
        badge: form.badge.trim(),
        summary: form.summary.trim(),
        takeaways: multilineToTextList(form.takeaways),
        sections: sectionsPayload,
        highlights: multilineToTextList(form.highlights),
        links: multilineToLinks(form.links),
      }

      const content = buildArticleEditorContent({ presentation: presentationData })

      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('content', content)
      formData.append('isPublished', String(form.isPublished))
      formData.append('presentation', JSON.stringify(presentationData))
      formData.append('removeImage', String(coverRemoved && !coverImage))

      if (coverImage) {
        formData.append('image', coverImage)
      }

      const url = articleId ? `/admin/articles/${articleId}` : '/admin/articles'

      const response = await api({
        method: articleId ? 'PUT' : 'POST',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = response.data

      if (!data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Ошибка сохранения статьи')
      }

      if (data?.data?.article) {
        const savedArticle = data.data.article
        setArticleId(savedArticle._id || articleId)
        setForm(buildFormFromArticle(savedArticle))
        setExistingCoverUrl(savedArticle.imageUrl ? buildAssetUrl(savedArticle.imageUrl) : '')
        setCoverPreview('')
        setCoverImage(null)
        setCoverRemoved(false)
      }

      toast.success(articleId ? 'Статья обновлена' : 'Статья создана')
      navigate('/admin/articles')
    } catch (saveError) {
      console.error('Error saving article:', saveError)
      const serverMessage = saveError?.response?.data?.error?.message || saveError?.response?.data?.message || ''
      const status = saveError?.response?.status

      if (status === 503) {
        toast.error(serverMessage || 'Сервер или база данных временно недоступны. Повтори сохранение через несколько секунд.')
      } else {
        toast.error(serverMessage || saveError.message || 'Ошибка сохранения')
      }
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
              checked={form.isPublished}
              onChange={(event) => handleFieldChange('isPublished', event.target.checked)}
            />
            <span>{form.isPublished ? 'Опубликована' : 'Черновик'}</span>
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
              <h2>Структура статьи</h2>
              <p>Настройка блоков статьи для сайта.</p>
            </div>

            {error ? <div className="article-editor-error">{error}</div> : null}

            <div className="article-editor-field">
              <label htmlFor="article-title">Заголовок</label>
              <input
                id="article-title"
                type="text"
                value={form.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                placeholder="Как выбрать игровую мышь для FPS-игр"
              />
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-badge">Тег категории</label>
              <input
                id="article-badge"
                type="text"
                value={form.badge}
                onChange={(event) => handleFieldChange('badge', event.target.value)}
                placeholder="FPS-гайд, Клавиатурный обзор, Топ-5 мышек, Гайд..."
              />
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-summary">Краткое описание</label>
              <textarea
                id="article-summary"
                rows="4"
                value={form.summary}
                onChange={(event) => handleFieldChange('summary', event.target.value)}
                placeholder="Короткое описание, которое показывается рядом с обложкой статьи"
              />
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-takeaways">Коротко о главном</label>
              <textarea
                id="article-takeaways"
                rows="5"
                value={form.takeaways}
                onChange={(event) => handleFieldChange('takeaways', event.target.value)}
                placeholder="Каждый тезис с новой строки"
              />
              <p className="article-editor-field-hint">Каждый пункт пиши с новой строки.</p>
            </div>

            <div className="article-editor-sections-block">
              <div className="article-editor-sections-header">
                <h3>Секции статьи</h3>
                <button type="button" className="article-editor-add-section" onClick={addSection}>
                  + Добавить секцию
                </button>
              </div>

              <div className="article-editor-sections-list">
                {form.sections.map((section, index) => (
                  <div key={`section-${index}`} className="article-editor-section-card">
                    <div className="article-editor-section-card-head">
                      <span>Секция {index + 1}</span>
                      <button type="button" className="article-editor-remove-section" onClick={() => removeSection(index)}>
                        Удалить
                      </button>
                    </div>

                    <div className="article-editor-field">
                      <label htmlFor={`section-title-${index}`}>Заголовок секции</label>
                      <input
                        id={`section-title-${index}`}
                        type="text"
                        value={section.title}
                        onChange={(event) => handleSectionChange(index, 'title', event.target.value)}
                        placeholder="Например: Форма и хват"
                      />
                    </div>

                    <div className="article-editor-field">
                      <label htmlFor={`section-points-${index}`}>Пункты секции</label>
                      <textarea
                        id={`section-points-${index}`}
                        rows="5"
                        value={section.points}
                        onChange={(event) => handleSectionChange(index, 'points', event.target.value)}
                        placeholder="Каждый пункт с новой строки"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-highlights">Что важно запомнить</label>
              <textarea
                id="article-highlights"
                rows="5"
                value={form.highlights}
                onChange={(event) => handleFieldChange('highlights', event.target.value)}
                placeholder="Каждый вывод с новой строки"
              />
            </div>

            <div className="article-editor-field">
              <label htmlFor="article-links">Полезные ссылки</label>
              <textarea
                id="article-links"
                rows="5"
                value={form.links}
                onChange={(event) => handleFieldChange('links', event.target.value)}
                placeholder="Формат строки: Название ссылки | /catalog"
              />
              <p className="article-editor-field-hint">Одна ссылка на строку в формате: текст ссылки | адрес.</p>
            </div>
          </article>

          <article className="article-editor-card">
            <div className="article-editor-card-head">
              <h2>Готовые шаблоны</h2>
              <p>Шаблоны сразу заполняют те же секции, которые потом выводятся на сайте.</p>
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
                  <img src={previewImageUrl} alt={form.title || 'Обложка статьи'} />
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
                  <span className="cover-upload-text">PNG, JPG, WEBP · до 10 МБ</span>
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

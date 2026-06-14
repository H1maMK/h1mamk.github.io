import { API_BASE_URL } from '../config/api'

const BACKEND_HOST = API_BASE_URL || 'http://localhost:3002'

const ARTICLE_BLUEPRINTS = [
  {
    match: ['мыш', 'fps'],
    badge: 'FPS-гайд',
    icon: '🎯',
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
          'Claw grip лучше работает на компактных и более “резких” моделях.',
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
    match: ['клавиатур', 'механических клавиатур', 'геймеров: что выбрать'],
    badge: 'Клавиатурный обзор',
    icon: '⌨️',
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
    match: ['как выбрать клавиатуру', 'гейминга'],
    badge: 'Выбор для гейминга',
    icon: '🧩',
    summary: 'Практический чек-лист: свитчи, раскладка, подсветка и детали сборки, которые важны перед покупкой.',
    takeaways: [
      'Оптические и аналоговые свитчи дают быстрый отклик.',
      'Размер клавиатуры влияет на свободу движения мыши.',
      'Подсветка — бонус, но не главный критерий.',
    ],
    sections: [
      {
        title: 'Тип переключателей',
        points: [
          'Линейные — для FPS и быстрых игр.',
          'Тактильные — универсальны и удобны в повседневном использовании.',
          'Оптические и аналоговые дают дополнительные преимущества в отклике.',
        ],
      },
      {
        title: 'Форм-фактор',
        points: [
          '100% подходит тем, кому важен numpad.',
          'TKL — самый сбалансированный вариант для игр.',
          '60–75% дают максимум свободного места под мышь.',
        ],
      },
      {
        title: 'Подключение и удобство',
        points: [
          'Проводной режим остаётся самым предсказуемым.',
          '2.4 ГГц предпочтительнее Bluetooth, если нужен low latency.',
          'Макросы, память профилей и подставка под запястья реально полезны.',
        ],
      },
      {
        title: 'Финальный совет',
        points: [
          'Первая механика должна быть удобной, а не самой дорогой.',
          'Перед покупкой лучше попробовать клавиатуру вживую.',
          'Смотри на корпус, стабилизаторы и качество колпачков.',
        ],
      },
    ],
    highlights: [
      'Хороший старт для первой механики.',
      'Удобство печати тоже имеет значение.',
      'Поддержка макросов полезна не всем, но часто выручает.',
    ],
    links: [
      { label: 'Смотреть все статьи', to: '/articles' },
      { label: 'Сравнить с топом клавиатур', to: '/articles/2' },
      { label: 'Перейти в каталог', to: '/catalog?device_category=Клавиатуры' },
    ],
  },
  {
    match: ['мышек', 'геймеров'],
    badge: 'Топ-5 мышек',
    icon: '🖱️',
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

const DEFAULT_PRESENTATION = {
  badge: 'Гайд',
  icon: '✨',
  summary: 'Коротко, наглядно и по делу — всё, что нужно, чтобы быстро разобраться в теме.',
  takeaways: [
    'Сравнивай не только цену, но и удобство.',
    'Смотри на реальные сценарии использования.',
    'Проверяй отзывы и детали комплектации.',
  ],
  sections: [
    {
      title: 'Коротко о главном',
      points: [
        'Сначала оцени сценарий использования.',
        'Потом смотри на форму, вес и удобство.',
        'После этого сравнивай характеристики и цену.',
      ],
    },
  ],
  highlights: [
    'Подойдёт для быстрого знакомства с темой.',
    'Есть полезные ссылки на связанные материалы.',
    'Фокус на практическом выборе, а не на рекламных цифрах.',
  ],
  links: [
    { label: 'Смотреть все статьи', to: '/articles' },
    { label: 'Открыть каталог', to: '/catalog' },
  ],
  theme: 'dark',
}

const HTML_TAG_REGEX = /<[^>]*>/g

const ARTICLE_IMAGE_FALLBACKS = [
  {
    match: ['мыш', 'fps'],
    file: 'article-1766344694795-251633868.png',
  },
  {
    match: ['топ-5 механических клавиатур', 'механических клавиатур', 'клавиатур для геймеров'],
    file: 'article-1766344701545-180627787.png',
  },
  {
    match: ['как выбрать клавиатуру', 'гейминга'],
    file: 'article-1766344707138-934004605.png',
  },
  {
    match: ['мышек', 'геймеров'],
    file: 'article-1766344712690-815385827.jpg',
  },
]

const toStringValue = (value) => `${value ?? ''}`.trim()

const normalizeTextList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const list = value.map((item) => toStringValue(item)).filter(Boolean)
    return list.length > 0 ? list : fallback
  }

  const text = toStringValue(value)
  if (!text) return fallback

  const list = text
    .split(/\r?\n+/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ''))
    .filter(Boolean)

  return list.length > 0 ? list : fallback
}

const normalizePoints = (value, fallback = []) => normalizeTextList(value, fallback)

const normalizeSections = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const sections = value
      .map((section) => ({
        title: toStringValue(section?.title),
        points: normalizePoints(section?.points),
      }))
      .filter((section) => section.title || section.points.length > 0)

    return sections.length > 0 ? sections : fallback
  }

  return fallback
}

const normalizeLinks = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const links = value
      .map((link) => ({
        label: toStringValue(link?.label),
        to: toStringValue(link?.to),
      }))
      .filter((link) => link.label && link.to)

    return links.length > 0 ? links : fallback
  }

  return fallback
}

const getArticleTitle = (article) => toStringValue(article?.title).toLowerCase()

const getFallbackArticleImage = (article) => {
  const title = getArticleTitle(article)
  const fallback = ARTICLE_IMAGE_FALLBACKS.find((item) =>
    item.match.some((needle) => title.includes(needle))
  )

  return fallback ? `${BACKEND_HOST}/uploads/articles/${fallback.file}` : ''
}

const getArticleFieldValue = (article, key) => {
  if (article?.presentation && article.presentation[key] !== undefined) {
    return article.presentation[key]
  }

  return article?.[key]
}

export const stripHtmlTags = (value = '') =>
  `${value}`.replace(HTML_TAG_REGEX, ' ').replace(/\s+/g, ' ').trim()

export const getArticleImageUrl = (article) => {
  const imageUrl = article?.imageUrl || article?.image || ''

  if (imageUrl.startsWith('http')) {
    return imageUrl
  }

  const normalizedPath = imageUrl.replace(/^\/+/, '')

  if (normalizedPath.startsWith('uploads/articles/')) {
    return `${BACKEND_HOST}/${normalizedPath}`
  }

  if (normalizedPath.startsWith('uploads/')) {
    const fallbackImage = getFallbackArticleImage(article)
    return fallbackImage || `${BACKEND_HOST}/uploads/articles/${normalizedPath.replace(/^uploads\//, '')}`
  }

  const fallbackImage = getFallbackArticleImage(article)
  return fallbackImage || (normalizedPath ? `${BACKEND_HOST}/${normalizedPath}` : '')
}

export const formatArticleDate = (value) => {
  if (!value) return ''
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}


export const getArticleExcerpt = (content, maxLength = 170) => {
  if (!content) return ''
  const cleanContent = stripHtmlTags(content)

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  return `${cleanContent.slice(0, maxLength).trim()}…`
}

export const getArticleBlueprint = (article) => {
  const title = `${article?.title || ''}`.toLowerCase()
  return (
    ARTICLE_BLUEPRINTS.find((blueprint) =>
      blueprint.match.some((needle) => title.includes(needle))
    ) || DEFAULT_PRESENTATION
  )
}

export const getArticlePresentation = (article) => {
  const blueprint = getArticleBlueprint(article)
  const presentation = article?.presentation || {}

  const badge = toStringValue(getArticleFieldValue(article, 'badge')) || blueprint.badge
  const icon = toStringValue(getArticleFieldValue(article, 'icon')) || blueprint.icon
  const summary = toStringValue(getArticleFieldValue(article, 'summary')) || blueprint.summary
  const theme = toStringValue(getArticleFieldValue(article, 'theme')) || blueprint.theme || DEFAULT_PRESENTATION.theme

  return {
    badge,
    icon,
    summary,
    takeaways: normalizeTextList(
      getArticleFieldValue(article, 'takeaways') ?? presentation.takeaways,
      blueprint.takeaways || DEFAULT_PRESENTATION.takeaways
    ),
    sections: normalizeSections(
      getArticleFieldValue(article, 'sections') ?? presentation.sections,
      blueprint.sections || DEFAULT_PRESENTATION.sections
    ),
    highlights: normalizeTextList(
      getArticleFieldValue(article, 'highlights') ?? presentation.highlights,
      blueprint.highlights || DEFAULT_PRESENTATION.highlights
    ),
    links: normalizeLinks(
      getArticleFieldValue(article, 'links') ?? presentation.links,
      blueprint.links || DEFAULT_PRESENTATION.links
    ),
    theme,
  }
}

const renderHtmlList = (items, tag = 'li') =>
  items
    .map((item) => `<${tag}>${item}</${tag}>`)
    .join('')

const renderRichTextBlock = (title, html) =>
  html ? `<section><h2>${title}</h2>${html}</section>` : ''

const renderLinkList = (links) =>
  links.length > 0
    ? renderRichTextBlock(
        'Полезные ссылки',
        `<ul>${renderHtmlList(
          links.map(
            (link) =>
              `<li><a href="${link.to}" target="_self" rel="noreferrer">${link.label}</a></li>`
          )
        )}</ul>`
      )
    : ''

export const buildArticleEditorContent = (article) => {
  if (article?.content) {
    return article.content
  }

  const presentation = getArticlePresentation(article)

  const contentParts = [
    `<p>${presentation.summary}</p>`,
    renderRichTextBlock(
      'Коротко о главном',
      `<ul>${renderHtmlList(presentation.takeaways.map((item) => `<li>${item}</li>`))}</ul>`
    ),
    presentation.sections
      .map(
        (section) =>
          `<section><h2>${section.title}</h2><ul>${renderHtmlList(
            section.points.map((point) => `<li>${point}</li>`)
          )}</ul></section>`
      )
      .join(''),
    renderRichTextBlock(
      'Что важно запомнить',
      `<ul>${renderHtmlList(presentation.highlights.map((item) => `<li>${item}</li>`))}</ul>`
    ),
    renderLinkList(presentation.links),
  ]

  return contentParts.filter(Boolean).join('')
}

export const getArticleMeta = (article) => {
  const presentation = getArticlePresentation(article)

  return {
    ...presentation,
    excerpt: getArticleExcerpt(article?.content),
    imageUrl: getArticleImageUrl(article),
    dateLabel: formatArticleDate(article?.publishedAt),
  }
}

export const ARTICLE_FEATURES = [
  {
    title: '4 статьи',
    description: 'Четыре собранных материала по мышам и клавиатурам',
  },
  {
    title: 'Структура',
    description: 'У каждой статьи теперь есть секции, вывод и краткие тезисы',
  },
  {
    title: 'Ссылки',
    description: 'Переходы к связанным темам и каталогу',
  },
]

export const ARTICLE_DEFAULT_PRESENTATION = DEFAULT_PRESENTATION

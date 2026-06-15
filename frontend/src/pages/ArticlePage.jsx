import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buildApiUrl, API_ENDPOINTS } from '../config/api'
import { getArticleMeta, getArticleImageUrl, stripHtmlTags } from '../utils/articlePresentation'
import './ArticlePage.css'

const FALLBACK_ARTICLES = [
  {
    _id: '1',
    title: 'Как выбрать игровую мышь для FPS-игр: советы и рекомендации',
    content:
      'Разбираем форму, вес, сенсор и беспроводные решения — всё, что помогает выбрать мышь без ошибок.',
    imageUrl: 'uploads/6857095596a26-statia1.jpg',
    publishedAt: '2025-06-21T13:33:22.000Z',
  },
  {
    _id: '2',
    title: 'Топ-5 механических клавиатур для геймеров: что выбрать?',
    content:
      'Подборка клавиатур с разными свитчами, форматами и подключением для игры и работы.',
    imageUrl: 'uploads/68570a3b2f71a-statia2.jpg',
    publishedAt: '2025-06-21T19:38:35.000Z',
  },
  {
    _id: '3',
    title: 'Как выбрать клавиатуру для гейминга?',
    content:
      'Ключевые критерии выбора механики: свитчи, формат, подсветка, материалы и дополнительные функции.',
    imageUrl: 'uploads/68570ad5b6fb5-statii3.jpg',
    publishedAt: '2025-06-21T19:41:09.000Z',
  },
  {
    _id: '4',
    title: 'Топ-5 мышек для геймеров: что выбрать?',
    content:
      'Собрали популярные модели с акцентом на вес, сенсор, форму корпуса и сценарии использования.',
    imageUrl: 'uploads/68570b5937cea-statia4.jpg',
    publishedAt: '2025-06-21T19:43:21.000Z',
  },
]

const splitArticleContent = (content = '') =>
  `${content}`
    .split(/\r?\n+/)
    .map((part) => stripHtmlTags(part))
    .filter(Boolean)

const ArticlePage = () => {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ARTICLES}/${id}`))
        const data = await response.json()

        if (data.success && data.data) {
          setArticle(data.data.article || data.data)
          return
        }

        const fallbackArticle = FALLBACK_ARTICLES.find((item) => item._id === id)
        if (fallbackArticle) {
          setArticle(fallbackArticle)
        } else {
          setError('Статья не найдена')
        }
      } catch (err) {
        console.error('Error loading article:', err)
        const fallbackArticle = FALLBACK_ARTICLES.find((item) => item._id === id)
        if (fallbackArticle) {
          setArticle(fallbackArticle)
        } else {
          setError('Ошибка загрузки статьи')
        }
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [id])

  const articleMeta = useMemo(() => (article ? getArticleMeta(article) : null), [article])

  if (loading) {
    return (
      <div className="page-wrapper article-page">
        <main className="article-page-main">
          <div className="article-container">
            <div className="loading article-loading">Загрузка статьи...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !article || !articleMeta) {
    return (
      <div className="page-wrapper article-page">
        <main className="article-page-main">
          <div className="article-container">
            <div className="article-empty-state">
              <span className="article-empty-badge">404</span>
              <h2>{error || 'Статья не найдена'}</h2>
              <p>Попробуйте открыть другую статью из раздела.</p>
              <div className="article-empty-actions">
                <Link to="/articles" className="article-button article-button-primary">
                  Ко всем статьям
                </Link>
                <Link to="/" className="article-button article-button-secondary">
                  На главную
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const imageUrl = getArticleImageUrl(article)

  return (
    <div className="page-wrapper article-page">
      <main className="article-page-main">
        <div className="article-container">
          <div className="article-topbar">
            <Link to="/articles" className="back-link">
              ← Все статьи
            </Link>
            <Link to="/" className="article-topbar-link">
              На главную
            </Link>
          </div>

          <section className="article-hero">
            <div className="article-hero-image-wrap">
              <img src={imageUrl} alt={article.title} className="article-hero-image" />
            </div>

            <div className="article-hero-copy">
              <h1 className="article-title">{article.title}</h1>
              <p className="article-summary">{articleMeta.summary}</p>

              <div className="article-meta-row">
                <span>{articleMeta.dateLabel || 'Без даты'}</span>
                {article.mysqlId ? <span>ID #{article.mysqlId}</span> : null}
              </div>

              <div className="article-links-row">
                {articleMeta.links.map((link) => (
                  <Link key={link.label} to={link.to} className="article-chip-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="article-layout">
            <article className="article-content">
              <h2 className="article-section-title">Коротко о главном</h2>
              <div className="article-story-grid">
                {articleMeta.takeaways.map((point) => (
                  <div key={point} className="article-story-card">
                    <span className="article-story-dot" />
                    <p>{point}</p>
                  </div>
                ))}
              </div>

              <div className="article-body">
                <h2 className="article-section-title">Материал статьи</h2>
                <div className="article-section-stack">
                  {articleMeta.sections.map((section) => (
                    <section key={section.title} className="article-text-block">
                      <h3>{section.title}</h3>
                      <ul>
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                {splitArticleContent(article.content).length > 0 ? (
                  <section className="article-text-block article-raw-content">
                    <h3>Текст статьи</h3>
                    <div className="article-raw-content-list">
                      {splitArticleContent(article.content).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </article>

            <aside className="article-sidebar">
              <div className="article-sidebar-card">
                <h3>Что здесь полезного</h3>
                <ul>
                  {articleMeta.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>


              <div className="article-sidebar-card article-sidebar-cta">
                <h3>Хочешь сравнить товары?</h3>
                <p>Переходи в каталог и смотри модели по категориям.</p>
                <Link to="/catalog" className="article-button article-button-primary full-width">
                  Открыть каталог
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ArticlePage

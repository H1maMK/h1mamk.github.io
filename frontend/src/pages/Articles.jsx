import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildApiUrl, API_ENDPOINTS } from '../config/api'
import { getArticleMeta } from '../utils/articlePresentation'
import './Articles.css'

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

const Articles = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ARTICLES}?limit=4`))
        const data = await response.json()

        if (data.success && data.data) {
          const list = data.data.articles || data.data || []
          setArticles(list.slice(0, 4))
        } else {
          setArticles(FALLBACK_ARTICLES)
        }
      } catch (error) {
        console.error('Error loading articles:', error)
        setArticles(FALLBACK_ARTICLES)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  const displayArticles = useMemo(() => {
    const source = articles.length > 0 ? articles : FALLBACK_ARTICLES
    return source.slice(0, 4).map((article) => ({
      ...article,
      meta: getArticleMeta(article),
    }))
  }, [articles])

  return (
    <div className="page-wrapper articles-page">
      <main className="articles-main">
        {loading ? (
          <div className="articles-loading">Загрузка статей...</div>
        ) : (
          <section className="articles-grid-section">
            <div className="articles-grid">
              {displayArticles.map((article, index) => {
                const { badge, icon, summary, dateLabel, excerpt, imageUrl, links, highlights } =
                  article.meta

                return (
                  <article key={article._id || index} className="article-card">
                    <Link to={`/articles/${article._id}`} className="article-card-image-link">
                      <img src={imageUrl} alt={article.title} className="article-card-image" loading="lazy" decoding="async" />
                      <div className="article-card-overlay">
                        <span className="article-card-badge">{badge}</span>
                        <span className="article-card-icon">{icon}</span>
                      </div>
                    </Link>

                    <div className="article-card-body">
                      <div className="article-card-meta">
                        <span>{dateLabel || 'Без даты'}</span>
                      </div>

                      <h2 className="article-card-title">
                        <Link to={`/articles/${article._id}`}>{article.title}</Link>
                      </h2>

                      <p className="article-card-summary">{summary}</p>
                      <p className="article-card-excerpt">{excerpt || article.content}</p>

                      <ul className="article-card-highlights">
                        {highlights.slice(0, 3).map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>

                      <div className="article-card-footer">
                        <Link to={`/articles/${article._id}`} className="article-card-readmore">
                          Читать статью
                        </Link>
                      </div>

                      <div className="article-card-links">
                        {links.map((link) => (
                          <Link key={link.label} to={link.to} className="article-mini-link">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="articles-sidebar">
              <div className="articles-sidebar-card">
                <h2>Что внутри раздела</h2>
                <p>
                  Здесь собраны 4 статьи про самые популярные игровые устройства:
                  мыши и клавиатуры. Каждая статья оформлена как отдельный мини-гайд.
                </p>
              </div>

              <div className="articles-sidebar-card">
                <h3>Как пользоваться</h3>
                <ol>
                  <li>Открывай статью по картинке или заголовку.</li>
                  <li>Смотри на краткий вывод и полезные ссылки.</li>
                  <li>Переходи в каталог, если хочешь сразу сравнить товары.</li>
                </ol>
              </div>

              <div className="articles-sidebar-card articles-sidebar-cta">
                <Link to="/catalog" className="articles-primary-link full-width">
                  Перейти в каталог
                </Link>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}

export default Articles

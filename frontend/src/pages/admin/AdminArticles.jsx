import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buildApiUrl, API_ENDPOINTS } from '../../config/api'
import { getArticleImageUrl, getArticleMeta } from '../../utils/articlePresentation'
import './AdminArticles.css'

const AdminArticles = () => {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setError('')
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ARTICLES}?includeUnpublished=true&limit=100`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setArticles(data.data?.articles || data.data || [])
      } else {
        setError(data.error?.message || 'Не удалось загрузить статьи')
        setArticles([])
      }
    } catch (fetchError) {
      console.error('Error fetching articles:', fetchError)
      setError('Ошибка загрузки статей')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (articleId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      return
    }

    try {
      setSavingId(articleId)
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN_ARTICLES}/${articleId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Ошибка при удалении статьи')
      }

      setArticles((current) => current.filter((article) => article._id !== articleId))
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError)
      alert(deleteError.message || 'Ошибка при удалении статьи')
    } finally {
      setSavingId('')
    }
  }

  const handleToggleVisibility = async (article) => {
    const actionText = article.isPublished ? 'скрыть' : 'показать'

    if (!window.confirm(`Вы уверены, что хотите ${actionText} эту статью?`)) {
      return
    }

    try {
      setSavingId(article._id)
      const formData = new FormData()
      formData.append('isPublished', String(!article.isPublished))

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN_ARTICLES}/${article._id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || data?.message || 'Ошибка изменения видимости')
      }

      setArticles((current) =>
        current.map((item) =>
          item._id === article._id ? { ...item, isPublished: !item.isPublished } : item
        )
      )
    } catch (toggleError) {
      console.error('Error toggling article visibility:', toggleError)
      alert(toggleError.message || 'Ошибка при изменении видимости статьи')
    } finally {
      setSavingId('')
    }
  }

  const normalizedArticles = useMemo(() => {
    const query = search.trim().toLowerCase()

    return articles
      .map((article) => ({
        ...article,
        meta: getArticleMeta(article),
        imageUrl: getArticleImageUrl(article),
      }))
      .filter((article) => {
        if (!query) return true
        return (
          `${article.title || ''}`.toLowerCase().includes(query) ||
          `${article.meta?.summary || ''}`.toLowerCase().includes(query)
        )
      })
  }, [articles, search])

  const stats = useMemo(() => {
    const published = articles.filter((article) => article.isPublished).length
    const drafts = articles.length - published

    return { total: articles.length, published, drafts }
  }, [articles])

  if (loading) {
    return <div className="admin-loading">Загрузка статей...</div>
  }

  return (
    <div className="admin-articles-page">
      <main className="admin-articles-container">
        <section className="admin-articles-hero">
          <article className="admin-articles-hero-copy">
            <span className="admin-kicker">Редактор DSLK</span>
            <h1>Статьи в том же визуальном стиле, что и главная</h1>
            <p>
              Управляй карточками статей, черновиками и видимостью без таблиц и перегруза.
              Карточки здесь оформлены так же, как публичные блоки на сайте.
            </p>

            <div className="admin-articles-hero-actions">
              <button type="button" className="admin-primary-btn" onClick={() => navigate('/admin/articles/new')}>
                Новая статья
              </button>
              <Link to="/articles" className="admin-secondary-btn">
                Открыть сайт
              </Link>
            </div>
          </article>

          <aside className="admin-articles-stats-panel">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Всего</span>
              <span className="admin-stat-value">{stats.total}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Опубликовано</span>
              <span className="admin-stat-value">{stats.published}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Черновики</span>
              <span className="admin-stat-value">{stats.drafts}</span>
            </div>
          </aside>
        </section>

        <section className="admin-articles-toolbar">
          <div className="admin-search-wrap">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="admin-search-input"
              placeholder="Поиск по заголовку или описанию"
            />
          </div>

          <div className="admin-toolbar-meta">
            {error ? error : `Показано ${normalizedArticles.length} из ${articles.length}`}
          </div>
        </section>

        {normalizedArticles.length > 0 ? (
          <section className="admin-articles-grid">
            {normalizedArticles.map((article, index) => {
              const meta = article.meta
              const imageUrl = article.imageUrl || meta.imageUrl
              const isSaving = savingId === article._id

              return (
                <article key={article._id || index} className="admin-article-card">
                  <Link to={`/articles/${article._id}`} className="admin-article-image-link">
                    <img src={imageUrl} alt={article.title} className="admin-article-image" />
                    <div className="admin-article-overlay">
                      <span className="admin-article-badge">{meta.badge}</span>
                      <span className="admin-article-icon">{meta.icon}</span>
                    </div>
                  </Link>

                  <div className="admin-article-body">
                    <div className="admin-article-meta">
                      <span>{meta.dateLabel || 'Без даты'}</span>
                      <span className={`admin-toggle-status ${article.isPublished ? 'published' : 'draft'}`}>
                        {article.isPublished ? 'Опубликована' : 'Черновик'}
                      </span>
                    </div>

                    <h2 className="admin-article-title">
                      <Link to={`/articles/${article._id}`}>{article.title}</Link>
                    </h2>

                    <div className="admin-article-actions">
                      <button
                        type="button"
                        className="admin-action-btn edit"
                        onClick={() => navigate(`/admin/articles/edit/${article._id}`)}
                        disabled={isSaving}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn toggle"
                        onClick={() => handleToggleVisibility(article)}
                        disabled={isSaving}
                      >
                        {article.isPublished ? 'Скрыть' : 'Показать'}
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn delete"
                        onClick={() => handleDelete(article._id)}
                        disabled={isSaving}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <section className="admin-articles-empty">
            <h2>Статьи не найдены</h2>
            <p>Создай первую статью или измени поисковый запрос.</p>
            <button type="button" className="admin-primary-btn" onClick={() => navigate('/admin/articles/new')}>
              Создать статью
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminArticles

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildApiUrl, API_ENDPOINTS } from '../config/api'
import { useFavorites } from '../contexts/FavoritesContext'
import RatingStars from '../components/RatingStars'
import { getImageProps } from '../utils/imageUtils'
import { getArticleImageUrl, getArticleMeta } from '../utils/articlePresentation'

const Home = () => {
  const [weeklyProducts, setWeeklyProducts] = useState([])
  const [articleProducts, setArticleProducts] = useState([])
  const [articles, setArticles] = useState([])
  const [promoProductId, setPromoProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsResponse, articlesResponse] = await Promise.all([
        fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTS}?limit=50`)),
        fetch(buildApiUrl(`${API_ENDPOINTS.ARTICLES}?limit=20`)),
      ])

      const [productsData, articlesData] = await Promise.all([
        productsResponse.json(),
        articlesResponse.json(),
      ])

      if (productsData.success && productsData.data) {
        const allProducts = Array.isArray(productsData.data)
          ? productsData.data
          : productsData.data.products || []
        const weeklyOnly = allProducts.filter((product) => product.isWeeklySpecial === true)
        const lamzuAtlantisProduct = allProducts.find((product) => {
          const productName = product.name || product.product_name || ''
          return /lamzu/i.test(productName) && /atlantis/i.test(productName)
        })

        setWeeklyProducts(weeklyOnly.slice(0, 4))
        setArticleProducts(allProducts.slice(0, 4))
        setPromoProductId(lamzuAtlantisProduct?._id || lamzuAtlantisProduct?.id || null)
      }

      if (articlesData.success && articlesData.data) {
        const articlesList = articlesData.data.articles || articlesData.data || []
        setArticles(articlesList)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    {
      name: 'Мышки',
      image: '/body/category/category mouse.svg',
      link: '/catalog?device_category=Мыши',
    },
    {
      name: 'Клавиатуры',
      image: '/body/category/category keyboard.svg',
      link: '/catalog?device_category=Клавиатуры',
    },
    {
      name: 'Наушники',
      image: '/body/category/category head.svg',
      link: '/catalog?device_category=Наушники',
    },
    {
      name: 'Мониторы',
      image: '/body/category/category moni.svg',
      link: '/catalog?device_category=Мониторы',
    },
    {
      name: 'Микрофоны',
      image: '/body/category/category micro.svg',
      link: '/catalog?device_category=Микрофоны',
    },
    {
      name: 'Веб-камеры',
      image: '/body/category/category web.svg',
      link: '/catalog?device_category=Веб-камеры',
    },
  ]

  const fallbackProducts = [
    {
      _id: '1',
      name: 'Игровая мышь Logitech G502',
      price: 4999,
      images: ['/m90.jpg'],
    },
    {
      _id: '2',
      name: 'Клавиатура Corsair K95',
      price: 12999,
      images: ['/m91.jpg'],
    },
    {
      _id: '3',
      name: 'Наушники SteelSeries Arctis 7',
      price: 8999,
      images: ['/m92.jpg'],
    },
    {
      _id: '4',
      name: 'Монитор ASUS ROG Swift',
      price: 45999,
      images: ['/m170.jpg'],
    },
  ]

  const fallbackArticles = [
    {
      _id: '1',
      title: 'Лучшие игровые мыши 2024 года',
      content: 'Подборка мышей для шутеров, универсального использования и киберспорта.',
      imageUrl: 'uploads/articles/article-1766344694795-251633868.png',
      publishedAt: '2025-06-21T13:33:22.000Z',
    },
    {
      _id: '2',
      title: 'Как выбрать клавиатуру для программирования',
      content: 'Практический разбор свитчей, форматов и полезных функций для работы и игр.',
      imageUrl: 'uploads/articles/article-1766344701545-180627787.png',
      publishedAt: '2025-06-21T19:38:35.000Z',
    },
    {
      _id: '3',
      title: 'Обзор новых наушников для геймеров',
      content: 'Что важно в гарнитуре для игр: звук, микрофон, посадка и сценарии использования.',
      imageUrl: 'uploads/articles/article-1766344707138-934004605.png',
      publishedAt: '2025-06-21T19:41:09.000Z',
    },
    {
      _id: '4',
      title: 'Тренды в мире игровых мониторов',
      content: 'Кратко про герцовку, матрицы и то, что реально влияет на опыт игрока.',
      imageUrl: 'uploads/articles/article-1766344712690-815385827.jpg',
      publishedAt: '2025-06-21T19:43:21.000Z',
    },
  ]

  const displayProducts = weeklyProducts
  const displayArticles = articles.length > 0 ? articles : fallbackArticles
  const displayArticleProducts = articleProducts.length > 0 ? articleProducts : fallbackProducts

  const renderHomeProductCard = (product) => {
    const productId = product._id || product.id
    const productName = product.name || product.product_name
    const productImage = product.images?.[0] || product.image_url1
    const isInFavorites = isFavorite(productId)
    const imageProps = getImageProps(productImage, productName)
    const rating = product.averageRating ?? product.avgRating ?? product.rating ?? 0
    const reviewCount = product.reviewCount ?? product.totalReviews ?? product.reviewsCount ?? 0

    const handleToggleFavorite = (event) => {
      event.preventDefault()
      if (isInFavorites) {
        removeFromFavorites(productId)
      } else {
        addToFavorites({
          id: productId,
          name: productName,
          price: product.price,
          image: productImage,
        })
      }
    }

    return (
      <div key={productId} className="product">
        <Link to={`/product/${productId}`}>
          <img {...imageProps} loading="lazy" decoding="async" />
        </Link>
        <div className="item___name">
          <Link to={`/product/${productId}`}>{productName}</Link>
        </div>
        <RatingStars rating={rating} reviewCount={reviewCount} className="product-card-rating" />
        <div className="price-row-home">
          <div className="price">{new Intl.NumberFormat('ru-RU').format(product.price)} ₽</div>
          <button
            className={`favorite-btn ${isInFavorites ? 'active' : ''}`}
            onClick={handleToggleFavorite}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isInFavorites ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const renderHomeArticleCard = (article) => {
    const imageUrl = getArticleImageUrl(article)

    return (
      <div key={article._id} className="statii-card">
        <Link to={`/articles/${article._id}`} className="statii-image-link">
          <img src={imageUrl} alt={article.title} loading="lazy" decoding="async" />
          <span className="statii-title">{article.title}</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="main-content-wrapper">
      <main>
        <Link to="/product/69481ab9a6adbe0a36ec3f88">
          <img className="promo_sell" src="/body/promo_sell.png" alt="Промо-акция" fetchPriority="high" decoding="async" />
        </Link>

        <p className="category_text">Категории</p>
        <div className="category-content">
          {categories.map((category, index) => (
            <Link key={index} to={category.link} className="category">
              <img src={category.image} alt={category.name} loading="lazy" decoding="async" />
            </Link>
          ))}
        </div>

        <p className="tovars_nedeli">Товары недели</p>
        {loading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : displayProducts.length > 0 ? (
          <div className="product-grid">{displayProducts.map(renderHomeProductCard)}</div>
        ) : (
          <div
            className="no-weekly-products"
            style={{ textAlign: 'center', padding: '40px', color: '#FFE6BB' }}
          >
            <p>Товары недели пока не выбраны</p>
          </div>
        )}

        <p className="statii_text">Статьи</p>
        {loading ? (
          <div className="loading">Загрузка статей...</div>
        ) : (
          <div className="statii-grid">{displayArticles.map(renderHomeArticleCard)}</div>
        )}

        <p className="tovars_nedeli more-products-title">Популярные товары</p>
        <div className="product-grid articles-products-grid">
          {displayArticleProducts.slice(0, 4).map(renderHomeProductCard)}
        </div>
      </main>
    </div>
  )
}

export default Home
